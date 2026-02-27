const express = require('express');
const router = express.Router();
const { identify } = require('../services/contactService');

router.post('/identify', (req, res) => {
  let { email, phoneNumber } = req.body;

  // Normalize input
  if (typeof phoneNumber === 'number') phoneNumber = String(phoneNumber);
  if (email === '') email = null;
  if (phoneNumber === '') phoneNumber = null;
  email = email || null;
  phoneNumber = phoneNumber || null;

  // Validate
  if (!email && !phoneNumber) {
    return res.status(400).json({ 
      error: 'At least one of email or phoneNumber must be provided' 
    });
  }

  try {
    const result = identify(email, phoneNumber);
    res.status(200).json(result);
  } catch (error) {
    console.error('Error in /identify:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;