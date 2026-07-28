import nodemailer from 'nodemailer';
import { SenderAccount } from '@prisma/client';
import { logger } from '../utils/logger.js';

export const createTransporter = (account: SenderAccount) => {
  if (account.provider === 'ETHEREAL') {
    // Fallback values if user passes placeholders, pulling from backend environment variables
    const user = account.smtpUser.includes('placeholder') ? process.env.ETHEREAL_USER : account.smtpUser;
    const pass = account.smtpPass.includes('placeholder') ? process.env.ETHEREAL_PASS : account.smtpPass;

    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false, // Ethereal uses STARTTLS
      auth: {
        user,
        pass,
      },
    });
  }

  // Generic SMTP connection settings (covers Gmail, Outlook, and customized servers)
  return nodemailer.createTransport({
    host: account.smtpHost,
    port: account.smtpPort,
    secure: account.smtpPort === 465, // SSL for 465, TLS/STARTTLS for 587/25
    auth: {
      user: account.smtpUser,
      pass: account.smtpPass,
    },
  });
};

export const testConnection = async (account: SenderAccount): Promise<boolean> => {
  try {
    const transporter = createTransporter(account);
    await transporter.verify();
    return true;
  } catch (error) {
    logger.error(`SMTP connection test failed for sender account: ${account.email}`, error);
    return false;
  }
};
