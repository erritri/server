const nodemailer = require('nodemailer');
const logger = require('./logger'); // Optional, bisa kamu ganti dengan console.log jika tidak pakai logger custom

// Buat transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Fungsi kirim email
const sendEmail = async ({ to, subject, template }) => {
  const mailOptions = {
    from: `"Portfolio App" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html: template
  };

  try {
    await transporter.sendMail(mailOptions);
    logger?.info
      ? logger.info(`Email sent to ${to}`)
      : console.log(`Email sent to ${to}`);
  } catch (err) {
    logger?.error
      ? logger.error('Email failed:', err.message)
      : console.error('Email failed:', err.message);
    throw new Error('Failed to send email');
  }
};

// Template email siap pakai (opsional)
const templates = {
  welcome: (name) => `
    <h1>Welcome, ${name}!</h1>
    <p>Thank you for contacting us.</p>
  `,
  autoReply: (name, message) => `
    <p>Hi ${name},</p>
    <p>Thank you for contacting us! We'll respond within 24 hours.</p>
    <p><strong>Your message:</strong></p>
    <blockquote>${message}</blockquote>
    <p>Best regards,<br>Portfolio Team</p>
  `,
  notifyAdmin: (msg) => `
    <h3>New Contact Message</h3>
    <p><strong>Name:</strong> ${msg.name}</p>
    <p><strong>Email:</strong> ${msg.email}</p>
    ${msg.phone ? `<p><strong>Phone:</strong> ${msg.phone}</p>` : ''}
    <p><strong>Message:</strong></p>
    <p>${msg.message}</p>
    <p>Received at: ${new Date().toLocaleString()}</p>
  `
};

module.exports = {
  sendEmail,
  templates
};
