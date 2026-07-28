import { prisma } from '../config/db.js';
import { emailQueue } from '../queue/email.queue.js';
import { logger } from '../utils/logger.js';
import { EmailStatus } from '@prisma/client';

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
