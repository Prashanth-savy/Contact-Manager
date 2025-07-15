const express = require('express');
const router = express.Router();
const {
  getAllContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  searchContacts,
  getStats
} = require('../controllers/contactController');

// Input validation middleware
const validateContactInput = (req, res, next) => {
  const { name, email } = req.body;
  
  // Trim whitespace
  if (name) req.body.name = name.trim();
  if (email) req.body.email = email.trim().toLowerCase();
  
  next();
};

// Rate limiting middleware (simple implementation)
const rateLimiter = (req, res, next) => {
  // In production, use a proper rate limiter like express-rate-limit
  next();
};

// Routes
router.get('/search', searchContacts);
router.get('/stats', getStats);
router.get('/', getAllContacts);
router.get('/:id', getContactById);
router.post('/', rateLimiter, validateContactInput, createContact);
router.put('/:id', rateLimiter, validateContactInput, updateContact);
router.delete('/:id', deleteContact);

module.exports = router;