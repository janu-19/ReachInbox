import { Worker, Job } from 'bullmq';
import { redisConfig } from '../config/redis.js';
import { prisma } from '../config/db.js';
import { createTransporter } from '../services/nodemailer.service.js';
import { logger } from '../utils/logger.js';
import { EMAIL_QUEUE_NAME } from '../queue/email.queue.js';
import { EmailStatus } from '@prisma/client';
import nodemailer from 'nodemailer';

// Simple regex-based template compiler for replacing variables (e.g., {{name}} or {{ name }})
const compileTemplate = (template: string, variables: Record<string, string>): string => {
  let compiled = template;
  for (const [key, value] of Object.entries(variables)) {
    compiled = compiled.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'gi'), value);
  }
  return compiled;
};

export const emailWorker = new Worker(
  EMAIL_QUEUE_NAME,
  async (job: Job<{ emailId: string }>) => {
    const { emailId } = job.data;
    logger.info(`Worker processing job ${job.id} for email ID ${emailId}`);

    // 1. Retrieve the scheduled email record with campaign and SMTP sender account details
    const email = await prisma.scheduledEmail.findUnique({
      where: { id: emailId },
      include: {
        campaign: {
          include: {
            senderAccount: true,
          },
        },
      },
    });

    if (!email) {
      logger.warn(`Scheduled email record not found for ID ${emailId}. Skipping job.`);
      return;
    }

    // 2. IDEMPOTENCY CHECK: If email has already been sent successfully, skip to prevent double-sending
    if (email.status === EmailStatus.SENT) {
      logger.info(`Email ${emailId} is already marked as SENT. Skipping dispatch to prevent duplicate delivery.`);
      return;
    }

    // 3. Update status in database to SENDING
    await prisma.scheduledEmail.update({
      where: { id: email.id },
      data: { status: EmailStatus.SENDING },
    });

    try {
      const { campaign, recipient } = email;
      const { senderAccount } = campaign;

      // 4. Parse recipient variables if they exist
      const variables: Record<string, string> = email.variables
        ? typeof email.variables === 'string'
          ? JSON.parse(email.variables)
          : (email.variables as Record<string, string>)
        : {};

      // 5. Compile Subject and Body templates
      const compiledSubject = compileTemplate(campaign.subject, variables);
      const compiledBody = compileTemplate(campaign.body, variables);

      // 6. Create Nodemailer SMTP Transporter dynamically using sender credentials
      const transporter = createTransporter(senderAccount);

      const senderDisplay = senderAccount.name ? `"${senderAccount.name}" <${senderAccount.email}>` : senderAccount.email;

      // 7. Dispatch email
      const info = await transporter.sendMail({
        from: senderDisplay,
        to: recipient,
        subject: compiledSubject,
        html: compiledBody,
      });

      logger.info(`Email successfully sent to ${recipient} (Campaign: ${campaign.id}). Message ID: ${info.messageId}`);

      // 8. Update database to SENT
      await prisma.scheduledEmail.update({
        where: { id: email.id },
        data: {
          status: EmailStatus.SENT,
          sentTime: new Date(),
          error: null,
        },
      });

      // For Ethereal SMTP, log preview URLs to the console for easy debugging
      if (senderAccount.provider === 'ETHEREAL') {
        const testUrl = nodemailer.getTestMessageUrl(info);
        if (testUrl) {
          logger.info(`Ethereal Email Preview URL: ${testUrl}`);
        }
      }

    } catch (error: any) {
      logger.error(`Error sending email ${email.id} to ${email.recipient}`, error);

      // 9. Update database status to FAILED and record error message
      await prisma.scheduledEmail.update({
        where: { id: email.id },
        data: {
          status: EmailStatus.FAILED,
          error: error.message || 'Unknown SMTP error',
        },
      });

      // 10. Re-throw the error to let BullMQ trigger retry strategy configurations
      throw error;
    }
  },
  {
    connection: redisConfig,
    concurrency: parseInt(process.env.WORKER_CONCURRENCY || '5'),
  }
);

// Worker error listeners
emailWorker.on('failed', (job, err) => {
  logger.error(`Worker job ${job?.id} failed finally:`, err);
});

emailWorker.on('error', (err) => {
  logger.error('Worker global runtime error:', err);
});
