import nodemailer from 'nodemailer';

const toBoolean = (value) => {
  if (typeof value !== 'string') return false;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
};

const buildTransporter = () => {
  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    throw new Error('SMTP configuration is missing. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS');
  }

  return nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: toBoolean(SMTP_SECURE),
    auth: {
      user: SMTP_USER,
      pass: SMTP_PASS,
    },
  });
};

const sendEmail = async ({ to, subject, html, text }) => {
  const transporter = buildTransporter();
  const from = process.env.EMAIL_FROM || process.env.SMTP_USER;

  await transporter.sendMail({
    from,
    to,
    subject,
    text,
    html,
  });
};

export const sendVerificationCodeEmail = async (to, code) => {
  await sendEmail({
    to,
    subject: 'Verify your account',
    text: `Your verification code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your verification code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`,
  });
};

export const sendPasswordResetCodeEmail = async (to, code) => {
  await sendEmail({
    to,
    subject: 'Reset your password',
    text: `Your password reset code is ${code}. It expires in 10 minutes.`,
    html: `<p>Your password reset code is <strong>${code}</strong>.</p><p>It expires in 10 minutes.</p>`,
  });
};
