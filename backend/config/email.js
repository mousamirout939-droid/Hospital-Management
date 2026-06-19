const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn('SMTP credentials not fully configured. Emails will be skipped.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

/**
 * Sends an email. Fails silently (logs only) so that core app flows
 * (registration, booking, etc.) never break because email is down.
 */
const sendEmail = async ({ to, subject, html, text }) => {
  try {
    const tx = getTransporter();
    if (!tx) return { sent: false, reason: 'SMTP not configured' };

    const info = await tx.sendMail({
      from: process.env.EMAIL_FROM || 'Hospital Management System <no-reply@hms.com>',
      to,
      subject,
      html,
      text,
    });

    return { sent: true, messageId: info.messageId };
  } catch (error) {
    console.error('Email send failed:', error.message);
    return { sent: false, reason: error.message };
  }
};

module.exports = { sendEmail };
