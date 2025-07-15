const Database = require('better-sqlite3');
const path = require('path');

// Database path
const dbPath = path.join(__dirname, '../../database/contacts.db');
const db = new Database(dbPath);

// Enable foreign keys and WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * Initialize database tables
 */
function initDatabase() {
  try {
    // Create contacts table
    const createContactsTable = `
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `;
    
    db.exec(createContactsTable);
    
    // Create index for email lookups
    db.exec('CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email)');
    
    // Create index for name searches
    db.exec('CREATE INDEX IF NOT EXISTS idx_contacts_name ON contacts(name)');
    
    console.log('✅ Database initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Get all contacts
 */
function getAllContacts() {
  const stmt = db.prepare('SELECT * FROM contacts ORDER BY name ASC');
  return stmt.all();
}

/**
 * Get contact by ID
 */
function getContactById(id) {
  const stmt = db.prepare('SELECT * FROM contacts WHERE id = ?');
  return stmt.get(id);
}

/**
 * Get contact by email
 */
function getContactByEmail(email) {
  const stmt = db.prepare('SELECT * FROM contacts WHERE email = ?');
  return stmt.get(email);
}

/**
 * Create a new contact
 */
function createContact(contactData) {
  const stmt = db.prepare(`
    INSERT INTO contacts (name, email) 
    VALUES (?, ?)
  `);
  
  const result = stmt.run(contactData.name, contactData.email);
  
  if (result.changes === 0) {
    throw new Error('Failed to create contact');
  }
  
  return getContactById(result.lastInsertRowid);
}

/**
 * Update contact
 */
function updateContact(id, contactData) {
  const stmt = db.prepare(`
    UPDATE contacts 
    SET name = ?, email = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = ?
  `);
  
  const result = stmt.run(contactData.name, contactData.email, id);
  
  if (result.changes === 0) {
    return null;
  }
  
  return getContactById(id);
}

/**
 * Delete contact
 */
function deleteContact(id) {
  const stmt = db.prepare('DELETE FROM contacts WHERE id = ?');
  const result = stmt.run(id);
  
  return result.changes > 0;
}

/**
 * Search contacts with basic text matching
 */
function searchContacts(query) {
  const searchTerm = `%${query}%`;
  const stmt = db.prepare(`
    SELECT * FROM contacts 
    WHERE name LIKE ? OR email LIKE ?
    ORDER BY name ASC
  `);
  
  return stmt.all(searchTerm, searchTerm);
}

/**
 * Get database statistics
 */
function getDatabaseStats() {
  const contactCount = db.prepare('SELECT COUNT(*) as count FROM contacts').get();
  const dbSize = db.prepare('SELECT page_count * page_size as size FROM pragma_page_count(), pragma_page_size()').get();
  
  return {
    contactCount: contactCount.count,
    databaseSize: dbSize.size,
    tables: ['contacts']
  };
}

/**
 * Close database connection
 */
function closeDatabase() {
  db.close();
}

module.exports = {
  initDatabase,
  getAllContacts,
  getContactById,
  getContactByEmail,
  createContact,
  updateContact,
  deleteContact,
  searchContacts,
  getDatabaseStats,
  closeDatabase
};