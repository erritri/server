const Message = require('../models/Message');
const { sendEmail } = require('../utils/email');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../middleware/asyncHandler');

// @desc    Create new message
// @route   POST /api/messages
// @access  Public
exports.createMessage = asyncHandler(async (req, res, next) => {
  const { name, email, message, subject, phone } = req.body;

  if (!name || !email || !message) {
    return next(new ErrorResponse('Name, email, and message are required', 400));
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return next(new ErrorResponse('Please enter a valid email address', 400));
  }

  const newMessage = await Message.create({
    name,
    email,
    message,
    subject: subject || 'No Subject',
    phone: phone || null,
    ipAddress: req.ip,
    userAgent: req.get('User-Agent')
  });

  try {
    await sendEmail({
      to: process.env.ADMIN_EMAIL,
      subject: `New Message from Portfolio: ${newMessage.subject}`,
      template: `
        <h3>New Contact Message</h3>
        <p><strong>Name:</strong> ${newMessage.name}</p>
        <p><strong>Email:</strong> ${newMessage.email}</p>
        ${newMessage.phone ? `<p><strong>Phone:</strong> ${newMessage.phone}</p>` : ''}
        <p><strong>Message:</strong></p>
        <p>${newMessage.message}</p>
        <p>Received at: ${new Date().toLocaleString()}</p>
      `
    });
  } catch (emailError) {
    console.error('Email notification failed:', emailError.message);
  }

  res.status(201).json({
    success: true,
    message: 'Thank you for your message! We will respond soon.'
  });

  try {
    await sendEmail({
      to: newMessage.email,
      subject: "We've received your message",
      template: `
        <p>Hi ${newMessage.name},</p>
        <p>Thank you for contacting us! We'll respond within 24 hours.</p>
        <p><strong>Your message:</strong></p>
        <blockquote>${newMessage.message}</blockquote>
        <p>Best regards,<br>Team</p>
      `
    });
  } catch (err) {
    console.error('Auto-reply failed:', err.message);
  }
});

// @desc    Get all messages
// @route   GET /api/messages
// @access  Private (admin)
exports.getAllMessages = asyncHandler(async (req, res, next) => {
  const messages = await Message.find().sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    count: messages.length,
    data: messages
  });
});
