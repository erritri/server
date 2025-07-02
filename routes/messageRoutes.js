const express = require('express');
const router = express.Router();
const { createMessage,  getAllMessages } = require('../controllers/messageController');

router.post('/', createMessage); // POST /api/messages
router.get('/', getAllMessages); // GET /api/messages

module.exports = router;