const ContactModel = require('../models/ContactModel');

/**
 * Get all contacts
 */
async function getAllContacts(req, res, next) {
  try {
    const contacts = await ContactModel.getAll();
    
    res.json({
      success: true,
      data: contacts,
      count: contacts.length,
      message: 'Contacts retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get contact by ID
 */
async function getContactById(req, res, next) {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid contact ID',
        message: 'Contact ID must be a valid number'
      });
    }
    
    const contact = await ContactModel.getById(parseInt(id));
    
    res.json({
      success: true,
      data: contact,
      message: 'Contact retrieved successfully'
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found',
        message: 'The requested contact does not exist'
      });
    }
    next(error);
  }
}

/**
 * Create a new contact
 */
async function createContact(req, res, next) {
  try {
    const contactData = req.body;
    
    // Validate required fields
    if (!contactData.name || !contactData.email) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'Name and email are required',
        fields: {
          name: !contactData.name ? 'Name is required' : null,
          email: !contactData.email ? 'Email is required' : null
        }
      });
    }
    
    const newContact = await ContactModel.create(contactData);
    
    res.status(201).json({
      success: true,
      data: newContact,
      message: 'Contact created successfully'
    });
  } catch (error) {
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate email',
        message: error.message,
        field: 'email'
      });
    }
    
    if (error.message.includes('validation') || error.message.includes('must be')) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.message
      });
    }
    
    next(error);
  }
}

/**
 * Update an existing contact
 */
async function updateContact(req, res, next) {
  try {
    const { id } = req.params;
    const contactData = req.body;
    
    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid contact ID',
        message: 'Contact ID must be a valid number'
      });
    }
    
    // Validate that at least one field is provided
    if (!contactData.name && !contactData.email) {
      return res.status(400).json({
        success: false,
        error: 'No data provided',
        message: 'At least one field (name or email) must be provided for update'
      });
    }
    
    const updatedContact = await ContactModel.update(parseInt(id), contactData);
    
    res.json({
      success: true,
      data: updatedContact,
      message: 'Contact updated successfully'
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found',
        message: 'The contact to update does not exist'
      });
    }
    
    if (error.message.includes('already exists')) {
      return res.status(409).json({
        success: false,
        error: 'Duplicate email',
        message: error.message,
        field: 'email'
      });
    }
    
    if (error.message.includes('validation') || error.message.includes('must be')) {
      return res.status(400).json({
        success: false,
        error: 'Validation error',
        message: error.message
      });
    }
    
    next(error);
  }
}

/**
 * Delete a contact
 */
async function deleteContact(req, res, next) {
  try {
    const { id } = req.params;
    
    // Validate ID
    if (!id || isNaN(parseInt(id))) {
      return res.status(400).json({
        success: false,
        error: 'Invalid contact ID',
        message: 'Contact ID must be a valid number'
      });
    }
    
    const result = await ContactModel.delete(parseInt(id));
    
    res.json({
      success: true,
      data: result,
      message: 'Contact deleted successfully'
    });
  } catch (error) {
    if (error.message.includes('not found')) {
      return res.status(404).json({
        success: false,
        error: 'Contact not found',
        message: 'The contact to delete does not exist'
      });
    }
    
    next(error);
  }
}

/**
 * Search contacts
 */
async function searchContacts(req, res, next) {
  try {
    const { q: query } = req.query;
    
    // If no query provided, return all contacts
    if (!query) {
      return getAllContacts(req, res, next);
    }
    
    // Validate query length
    if (query.length > 100) {
      return res.status(400).json({
        success: false,
        error: 'Query too long',
        message: 'Search query must not exceed 100 characters'
      });
    }
    
    const contacts = await ContactModel.search(query);
    
    res.json({
      success: true,
      data: contacts,
      count: contacts.length,
      query: query,
      message: `Found ${contacts.length} contact(s) matching "${query}"`
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get database statistics
 */
async function getStats(req, res, next) {
  try {
    const stats = await ContactModel.getStats();
    
    res.json({
      success: true,
      data: stats,
      message: 'Statistics retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getAllContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
  searchContacts,
  getStats
};