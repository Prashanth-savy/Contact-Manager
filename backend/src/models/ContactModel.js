const Joi = require('joi');
const { levenshteinDistance } = require('../utils/searchUtils');
const db = require('./database');

/**
 * Contact validation schema
 */
const contactSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.empty': 'Name is required',
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 100 characters'
    }),
  
  email: Joi.string()
    .email()
    .trim()
    .lowercase()
    .max(255)
    .required()
    .messages({
      'string.empty': 'Email is required',
      'string.email': 'Email must be valid',
      'string.max': 'Email must not exceed 255 characters'
    })
});

/**
 * Contact update schema (allows partial updates)
 */
const contactUpdateSchema = Joi.object({
  name: Joi.string()
    .trim()
    .min(2)
    .max(100)
    .messages({
      'string.min': 'Name must be at least 2 characters long',
      'string.max': 'Name must not exceed 100 characters'
    }),
  
  email: Joi.string()
    .email()
    .trim()
    .lowercase()
    .max(255)
    .messages({
      'string.email': 'Email must be valid',
      'string.max': 'Email must not exceed 255 characters'
    })
}).min(1);

class ContactModel {
  /**
   * Validate contact data
   */
  static validate(contactData, isUpdate = false) {
    const schema = isUpdate ? contactUpdateSchema : contactSchema;
    const { error, value } = schema.validate(contactData);
    
    if (error) {
      throw new Error(error.details[0].message);
    }
    
    return value;
  }

  /**
   * Get all contacts
   */
  static async getAll() {
    try {
      return db.getAllContacts();
    } catch (error) {
      throw new Error(`Failed to retrieve contacts: ${error.message}`);
    }
  }

  /**
   * Get contact by ID
   */
  static async getById(id) {
    try {
      const contact = db.getContactById(id);
      if (!contact) {
        throw new Error('Contact not found');
      }
      return contact;
    } catch (error) {
      throw new Error(`Failed to retrieve contact: ${error.message}`);
    }
  }

  /**
   * Create a new contact
   */
  static async create(contactData) {
    try {
      // Validate input
      const validatedData = this.validate(contactData);
      
      // Check if email already exists
      const existingContact = db.getContactByEmail(validatedData.email);
      if (existingContact) {
        throw new Error('A contact with this email already exists');
      }
      
      // Create contact
      return db.createContact(validatedData);
    } catch (error) {
      throw new Error(`Failed to create contact: ${error.message}`);
    }
  }

  /**
   * Update an existing contact
   */
  static async update(id, contactData) {
    try {
      // Validate input
      const validatedData = this.validate(contactData, true);
      
      // Check if contact exists
      const existingContact = db.getContactById(id);
      if (!existingContact) {
        throw new Error('Contact not found');
      }
      
      // If email is being updated, check for duplicates
      if (validatedData.email && validatedData.email !== existingContact.email) {
        const emailExists = db.getContactByEmail(validatedData.email);
        if (emailExists) {
          throw new Error('A contact with this email already exists');
        }
      }
      
      // Merge with existing data
      const updateData = {
        name: validatedData.name || existingContact.name,
        email: validatedData.email || existingContact.email
      };
      
      return db.updateContact(id, updateData);
    } catch (error) {
      throw new Error(`Failed to update contact: ${error.message}`);
    }
  }

  /**
   * Delete a contact
   */
  static async delete(id) {
    try {
      const success = db.deleteContact(id);
      if (!success) {
        throw new Error('Contact not found');
      }
      return { success: true, message: 'Contact deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete contact: ${error.message}`);
    }
  }

  /**
   * Search contacts with typo tolerance
   */
  static async search(query) {
    try {
      if (!query || query.trim().length === 0) {
        return this.getAll();
      }

      const searchTerm = query.trim().toLowerCase();
      
      // Get all contacts for fuzzy matching
      const allContacts = db.getAllContacts();
      
      // First, try exact and partial matches
      const exactMatches = allContacts.filter(contact => 
        contact.name.toLowerCase().includes(searchTerm) ||
        contact.email.toLowerCase().includes(searchTerm)
      );

      // If we have exact matches, return them
      if (exactMatches.length > 0) {
        return exactMatches;
      }

      // If no exact matches, try fuzzy matching
      const fuzzyMatches = [];
      const maxDistance = Math.max(2, Math.floor(searchTerm.length * 0.3)); // 30% error tolerance

      for (const contact of allContacts) {
        const nameDistance = levenshteinDistance(contact.name.toLowerCase(), searchTerm);
        const emailDistance = levenshteinDistance(contact.email.toLowerCase(), searchTerm);
        
        // Also check if search term is contained within name or email with some tolerance
        const nameWords = contact.name.toLowerCase().split(' ');
        const emailParts = contact.email.toLowerCase().split('@');
        
        let isMatch = false;
        
        // Check direct distance
        if (nameDistance <= maxDistance || emailDistance <= maxDistance) {
          isMatch = true;
        }
        
        // Check word-by-word for names
        for (const word of nameWords) {
          if (levenshteinDistance(word, searchTerm) <= maxDistance) {
            isMatch = true;
            break;
          }
        }
        
        // Check email parts
        for (const part of emailParts) {
          if (levenshteinDistance(part, searchTerm) <= maxDistance) {
            isMatch = true;
            break;
          }
        }
        
        if (isMatch) {
          fuzzyMatches.push({
            ...contact,
            matchScore: Math.min(nameDistance, emailDistance)
          });
        }
      }

      // Sort by match score (lower is better)
      return fuzzyMatches
        .sort((a, b) => a.matchScore - b.matchScore)
        .map(({ matchScore, ...contact }) => contact);
        
    } catch (error) {
      throw new Error(`Failed to search contacts: ${error.message}`);
    }
  }

  /**
   * Get database statistics
   */
  static async getStats() {
    try {
      return db.getDatabaseStats();
    } catch (error) {
      throw new Error(`Failed to get statistics: ${error.message}`);
    }
  }
}

module.exports = ContactModel;