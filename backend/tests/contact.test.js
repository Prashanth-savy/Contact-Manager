const request = require('supertest');
const app = require('../src/server');
const { levenshteinDistance, calculateSimilarity } = require('../src/utils/searchUtils');

describe('Contact Manager API', () => {
  let testContactId;

  // Clean up after tests
  afterAll(async () => {
    // Clean up test data if needed
    if (testContactId) {
      await request(app).delete(`/api/contacts/${testContactId}`);
    }
  });

  describe('Health Check', () => {
    test('GET /api/health should return OK', async () => {
      const response = await request(app)
        .get('/api/health')
        .expect(200);

      expect(response.body.status).toBe('OK');
      expect(response.body).toHaveProperty('timestamp');
    });
  });

  describe('Contact CRUD Operations', () => {
    test('POST /api/contacts should create a new contact', async () => {
      const newContact = {
        name: 'John Doe',
        email: 'john.doe@example.com'
      };

      const response = await request(app)
        .post('/api/contacts')
        .send(newContact)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe(newContact.name);
      expect(response.body.data.email).toBe(newContact.email);
      
      testContactId = response.body.data.id;
    });

    test('POST /api/contacts should reject duplicate email', async () => {
      const duplicateContact = {
        name: 'Jane Doe',
        email: 'john.doe@example.com' // Same email as above
      };

      const response = await request(app)
        .post('/api/contacts')
        .send(duplicateContact)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Duplicate email');
    });

    test('POST /api/contacts should validate required fields', async () => {
      const invalidContact = {
        name: 'Jane Doe'
        // Missing email
      };

      const response = await request(app)
        .post('/api/contacts')
        .send(invalidContact)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Missing required fields');
    });

    test('POST /api/contacts should validate email format', async () => {
      const invalidContact = {
        name: 'Jane Doe',
        email: 'invalid-email'
      };

      const response = await request(app)
        .post('/api/contacts')
        .send(invalidContact)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation error');
    });

    test('GET /api/contacts should return all contacts', async () => {
      const response = await request(app)
        .get('/api/contacts')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    test('GET /api/contacts/:id should return specific contact', async () => {
      const response = await request(app)
        .get(`/api/contacts/${testContactId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testContactId);
      expect(response.body.data.name).toBe('John Doe');
    });

    test('GET /api/contacts/:id should return 404 for non-existent contact', async () => {
      const response = await request(app)
        .get('/api/contacts/99999')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Contact not found');
    });

    test('PUT /api/contacts/:id should update contact', async () => {
      const updateData = {
        name: 'John Updated'
      };

      const response = await request(app)
        .put(`/api/contacts/${testContactId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('John Updated');
      expect(response.body.data.email).toBe('john.doe@example.com'); // Should remain unchanged
    });

    test('DELETE /api/contacts/:id should delete contact', async () => {
      const response = await request(app)
        .delete(`/api/contacts/${testContactId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Contact deleted successfully');

      // Verify contact is deleted
      await request(app)
        .get(`/api/contacts/${testContactId}`)
        .expect(404);

      testContactId = null; // Reset for cleanup
    });
  });

  describe('Search Functionality', () => {
    let searchTestContacts = [];

    beforeAll(async () => {
      // Create test contacts for search
      const testContacts = [
        { name: 'Alice Smith', email: 'alice.smith@example.com' },
        { name: 'Bob Johnson', email: 'bob.johnson@gmail.com' },
        { name: 'Charlie Brown', email: 'charlie@company.com' },
        { name: 'David Wilson', email: 'david.wilson@test.com' }
      ];

      for (const contact of testContacts) {
        const response = await request(app)
          .post('/api/contacts')
          .send(contact);
        searchTestContacts.push(response.body.data);
      }
    });

    afterAll(async () => {
      // Clean up test contacts
      for (const contact of searchTestContacts) {
        await request(app).delete(`/api/contacts/${contact.id}`);
      }
    });

    test('GET /api/contacts/search should return all contacts when no query', async () => {
      const response = await request(app)
        .get('/api/contacts/search')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThanOrEqual(4);
    });

    test('GET /api/contacts/search should find exact matches', async () => {
      const response = await request(app)
        .get('/api/contacts/search?q=Alice')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].name).toContain('Alice');
    });

    test('GET /api/contacts/search should find partial matches', async () => {
      const response = await request(app)
        .get('/api/contacts/search?q=john')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].name.toLowerCase()).toContain('john');
    });

    test('GET /api/contacts/search should find email matches', async () => {
      const response = await request(app)
        .get('/api/contacts/search?q=gmail')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].email).toContain('gmail');
    });

    test('GET /api/contacts/search should handle typos', async () => {
      const response = await request(app)
        .get('/api/contacts/search?q=Alise') // Typo for Alice
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should find Alice even with typo
      const hasAlice = response.body.data.some(contact => 
        contact.name.toLowerCase().includes('alice')
      );
      expect(hasAlice).toBe(true);
    });
  });

  describe('Edge Cases and Validation', () => {
    test('POST /api/contacts should trim whitespace', async () => {
      const contactWithSpaces = {
        name: '  John Trimmed  ',
        email: '  john.trimmed@example.com  '
      };

      const response = await request(app)
        .post('/api/contacts')
        .send(contactWithSpaces)
        .expect(201);

      expect(response.body.data.name).toBe('John Trimmed');
      expect(response.body.data.email).toBe('john.trimmed@example.com');

      // Cleanup
      await request(app).delete(`/api/contacts/${response.body.data.id}`);
    });

    test('POST /api/contacts should reject empty name', async () => {
      const invalidContact = {
        name: '',
        email: 'test@example.com'
      };

      await request(app)
        .post('/api/contacts')
        .send(invalidContact)
        .expect(400);
    });

    test('GET /api/contacts/search should handle special characters', async () => {
      const response = await request(app)
        .get('/api/contacts/search?q=@example')
        .expect(200);

      expect(response.body.success).toBe(true);
      // Should find contacts with @example in email
    });
  });
});

describe('Search Utils', () => {
  describe('levenshteinDistance', () => {
    test('should calculate correct distance for identical strings', () => {
      expect(levenshteinDistance('hello', 'hello')).toBe(0);
    });

    test('should calculate correct distance for different strings', () => {
      expect(levenshteinDistance('hello', 'hallo')).toBe(1);
      expect(levenshteinDistance('hello', 'world')).toBe(4);
    });

    test('should handle empty strings', () => {
      expect(levenshteinDistance('', 'hello')).toBe(5);
      expect(levenshteinDistance('hello', '')).toBe(5);
      expect(levenshteinDistance('', '')).toBe(0);
    });
  });

  describe('calculateSimilarity', () => {
    test('should return 100% for identical strings', () => {
      expect(calculateSimilarity('hello', 'hello')).toBe(100);
    });

    test('should return correct similarity percentage', () => {
      const similarity = calculateSimilarity('hello', 'hallo');
      expect(similarity).toBeGreaterThan(80);
      expect(similarity).toBeLessThan(100);
    });

    test('should handle case insensitive comparison', () => {
      expect(calculateSimilarity('Hello', 'hello')).toBe(100);
    });
  });
});