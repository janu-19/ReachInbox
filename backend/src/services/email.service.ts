import { prisma } from '../config/db.js';
import { emailQueue } from '../queue/email.queue.js';
import { logger } from '../utils/logger.js';
import { EmailStatus } from '@prisma/client';
import { createTransporter } from './nodemailer.service.js';
import { redisClient } from '../config/redis.js';
import { Job } from 'bullmq';
import nodemailer from 'nodemailer';

export interface ScheduleCampaignInput {
  userId: string;
  senderAccountId: string;
  name: string;
  subject: string;
  body: string;
  startTime: Date;
  delaySeconds: number;
  hourlyLimit: number;
  recipients: {
    email: string;
    variables?: Record<string, string>;
  }[];
}

export const scheduleCampaign = async (input: ScheduleCampaignInput) => {
  const {
    userId,
    senderAccountId,
    name,
    subject,
    body,
    startTime,
    delaySeconds,
    hourlyLimit,
    recipients,
  } = input;

  // 1. Verify that the sender account belongs to the user
  const senderAccount = await prisma.senderAccount.findFirst({
    where: { id: senderAccountId, userId },
  });

  if (!senderAccount) {
    throw new Error('Sender account not found or access denied.');
  }

  // 2. Create the Campaign record in the database
  const campaign = await prisma.campaign.create({
    data: {
      userId,
      senderAccountId,
      name,
      subject,
      body,
      startTime,
      delaySeconds,
      hourlyLimit,
      status: 'ACTIVE',
    },
  });

  logger.info(`Created campaign ${campaign.id} for user ${userId}. Scheduling emails...`);

  // 3. Prepare individual scheduled email payloads with calculations for rates and delay
  const emailsData = recipients.map((recipientObj, index) => {
    // Determine which hour slot this email falls into based on hourly limit
    const hourOffset = Math.floor(index / hourlyLimit);
    // Determine the position in the current hour bucket
    const positionInHour = index % hourlyLimit;
    
    // Add cumulative delay within that hour slot
    const scheduledTime = new Date(
      startTime.getTime() +
      (hourOffset * 60 * 60 * 1000) + // Add hours
      (positionInHour * delaySeconds * 1000) // Add seconds
    );

    const idempotencyKey = `${campaign.id}:${recipientObj.email.trim().toLowerCase()}`;

    return {
      campaignId: campaign.id,
      recipient: recipientObj.email.trim().toLowerCase(),
      variables: recipientObj.variables || undefined,
      scheduledTime,
      status: EmailStatus.SCHEDULED,
      idempotencyKey,
    };
  });

  // 4. Perform bulk insert in the database (ignores duplicate recipients for the campaign)
  const result = await prisma.scheduledEmail.createMany({
    data: emailsData,
    skipDuplicates: true,
  });

  logger.info(`Inserted ${result.count} scheduled email records for campaign ${campaign.id}.`);

  // 5. Fetch all the emails just inserted to retrieve their IDs for BullMQ queue setup
  const scheduledEmails = await prisma.scheduledEmail.findMany({
    where: { campaignId: campaign.id },
  });

  // 6. Push jobs into the BullMQ Redis queue
  const now = Date.now();
  const queuePromises = scheduledEmails.map(async (email) => {
    const delay = Math.max(0, email.scheduledTime.getTime() - now);
    
    // Use the database record ID as the BullMQ jobId to enforce queue-level idempotency
    await emailQueue.add(
      'send-email',
      { emailId: email.id },
      {
        delay,
        jobId: email.id, // BullMQ ignores duplicate job additions with the same ID
      }
    );

    // Update the record with the jobId reference
    await prisma.scheduledEmail.update({
      where: { id: email.id },
      data: { jobId: email.id },
    });
  });

  await Promise.all(queuePromises);
  logger.info(`Successfully added ${scheduledEmails.length} jobs to BullMQ for campaign ${campaign.id}`);

  return {
    campaignId: campaign.id,
    totalScheduled: scheduledEmails.length,
  };
};

// Reschedule function shifting target time by exactly 1 hour to preserve relative order/delays
const rescheduleEmail = async (email: any, token?: string, job?: Job) => {
  const newScheduledTime = new Date(email.scheduledTime.getTime() + 60 * 60 * 1000);
  
  logger.info(`Rescheduling email ${email.id} to next hour: ${newScheduledTime.toISOString()}`);

  // 1. Reset database record status to SCHEDULED and adjust time
  await prisma.scheduledEmail.update({
    where: { id: email.id },
    data: {
      status: EmailStatus.SCHEDULED,
      scheduledTime: newScheduledTime,
      error: 'Rescheduled: Sender hourly rate limit exceeded.',
    },
  });

  const delay = Math.max(0, newScheduledTime.getTime() - Date.now());

  // 2. Put job back in delayed queue
  if (job && token) {
    // Native BullMQ move to delayed set
    await job.moveToDelayed(Date.now() + delay, token);
    logger.info(`Moved active BullMQ job ${job.id} to delayed status (Delay: ${delay}ms)`);
  } else {
    // Fallback if token or job instance isn't available
    await emailQueue.add(
      'send-email',
      { emailId: email.id },
      {
        delay,
        jobId: email.id,
      }
    );
  }
};

export const sendScheduledEmail = async (emailId: string, token?: string, job?: Job) => {
  logger.info(`Processing dispatch request for email ID ${emailId}`);

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
    logger.warn(`Scheduled email record not found for ID ${emailId}. Skipping send.`);
    return;
  }

  // 2. IDEMPOTENCY CHECK: If email has already been sent successfully, skip to prevent double-sending
  if (email.status === EmailStatus.SENT) {
    logger.info(`Email ${emailId} is already marked as SENT. Skipping dispatch to prevent duplicate delivery.`);
    return;
  }

  const { campaign } = email;
  const { senderAccount } = campaign;

  // 3. RATE LIMITING CHECK
  const limit = campaign.hourlyLimit;
  // Format the key using fixed-hour buckets: YYYY-MM-DDTHH
  const hourBucket = new Date().toISOString().substring(0, 13);
  const redisKey = `sender:rate:${senderAccount.id}:${hourBucket}`;

  // Read current window count to save an INCR operation
  const currentCountStr = await redisClient.get(redisKey);
  const currentCount = currentCountStr ? parseInt(currentCountStr) : 0;

  if (currentCount >= limit) {
    logger.info(`Hourly limit of ${limit} emails reached for sender ${senderAccount.email}. Rescheduling...`);
    await rescheduleEmail(email, token, job);
    return;
  }

  // Increment atomically in Redis
  const count = await redisClient.incr(redisKey);
  if (count === 1) {
    // Set 2 hours TTL on first bucket increment
    await redisClient.expire(redisKey, 7200);
  }

  // Race condition fallback
  if (count > limit) {
    logger.info(`Race condition: Hourly limit exceeded (${count} > ${limit}) for sender ${senderAccount.email}. Rescheduling...`);
    await rescheduleEmail(email, token, job);
    return;
  }

  // 4. Update status in database to SENDING
  await prisma.scheduledEmail.update({
    where: { id: email.id },
    data: { status: EmailStatus.SENDING },
  });

  try {
    const { recipient } = email;

    // 5. Parse recipient variables if they exist
    const variables: Record<string, string> = email.variables
      ? typeof email.variables === 'string'
        ? JSON.parse(email.variables)
        : (email.variables as Record<string, string>)
      : {};

    // 6. Compile Subject and Body templates
    const compileTemplate = (template: string, vars: Record<string, string>): string => {
      let compiled = template;
      for (const [key, value] of Object.entries(vars)) {
        compiled = compiled.replace(new RegExp(`{{\\s*${key}\\s*}}`, 'gi'), value);
      }
      return compiled;
    };

    const compiledSubject = compileTemplate(campaign.subject, variables);
    const compiledBody = compileTemplate(campaign.body, variables);

    // 7. Create Nodemailer SMTP Transporter dynamically using sender credentials
    const transporter = await createTransporter(senderAccount);

    const senderDisplay = senderAccount.name ? `"${senderAccount.name}" <${senderAccount.email}>` : senderAccount.email;

    // 8. Dispatch email
    const info = await transporter.sendMail({
      from: senderDisplay,
      to: recipient,
      subject: compiledSubject,
      html: compiledBody,
    });

    logger.info(`Email successfully sent to ${recipient} (Campaign: ${campaign.id}). Message ID: ${info.messageId}`);

    // 9. Update database to SENT
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

    // 10. Update database status to FAILED and record error message
    await prisma.scheduledEmail.update({
      where: { id: email.id },
      data: {
        status: EmailStatus.FAILED,
        error: error.message || 'Unknown SMTP error',
      },
    });

    // 11. Re-throw the error to let BullMQ trigger retry strategy configurations
    throw error;
  }
};
