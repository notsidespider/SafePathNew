/**
 * Database Service
 * Handles all SQLite database operations
 * Version 2.1 - No journal feature
 */

import SQLite from 'react-native-sqlite-storage';
import { DATABASE } from '../constants';

SQLite.enablePromise(true);

class DatabaseServiceClass {
  constructor() {
    this.db = null;
  }

  /**
   * Initialize the database and create tables
   */
  async initDatabase() {
    try {
      this.db = await SQLite.openDatabase({
        name: DATABASE.NAME,
        location: 'default',
      });

      await this.createTables();
      console.log('Database initialized successfully');
      return true;
    } catch (error) {
      console.error('Database initialization error:', error);
      throw error;
    }
  }

  /**
   * Create all necessary tables
   */
  async createTables() {
    // Emergency Contacts Table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS emergency_contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        phone TEXT NOT NULL,
        relationship TEXT,
        is_primary INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Safety Resources Table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS safety_resources (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        address TEXT,
        phone TEXT,
        latitude REAL,
        longitude REAL,
        hours TEXT,
        description TEXT,
        is_active INTEGER DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Alert History Table
    await this.db.executeSql(`
      CREATE TABLE IF NOT EXISTS alert_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        sent_to TEXT NOT NULL,
        message TEXT NOT NULL,
        latitude REAL,
        longitude REAL,
        sms_status TEXT,
        platform TEXT,
        success INTEGER DEFAULT 1,
        sent_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('All tables created successfully');
  }

  /**
   * Emergency Contacts CRUD Operations
   */
  async addEmergencyContact(contact) {
    const { name, phone, relationship, isPrimary } = contact;
    const result = await this.db.executeSql(
      'INSERT INTO emergency_contacts (name, phone, relationship, is_primary) VALUES (?, ?, ?, ?)',
      [name, phone, relationship || '', isPrimary ? 1 : 0]
    );
    return result[0].insertId;
  }

  async getEmergencyContacts() {
    const results = await this.db.executeSql(
      'SELECT * FROM emergency_contacts ORDER BY is_primary DESC, name ASC'
    );
    return results[0].rows.raw();
  }

  async updateEmergencyContact(id, contact) {
    const { name, phone, relationship, isPrimary } = contact;
    await this.db.executeSql(
      'UPDATE emergency_contacts SET name = ?, phone = ?, relationship = ?, is_primary = ? WHERE id = ?',
      [name, phone, relationship || '', isPrimary ? 1 : 0, id]
    );
  }

  async deleteEmergencyContact(id) {
    await this.db.executeSql('DELETE FROM emergency_contacts WHERE id = ?', [id]);
  }

  /**
   * Safety Resources CRUD Operations
   */
  async addSafetyResource(resource) {
    const { name, type, address, phone, latitude, longitude, hours, description } = resource;
    const result = await this.db.executeSql(
      'INSERT INTO safety_resources (name, type, address, phone, latitude, longitude, hours, description) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [name, type, address || '', phone || '', latitude || null, longitude || null, hours || '', description || '']
    );
    return result[0].insertId;
  }

  async getSafetyResources(type = null) {
    let query = 'SELECT * FROM safety_resources WHERE is_active = 1';
    let params = [];
    
    if (type) {
      query += ' AND type = ?';
      params.push(type);
    }
    
    query += ' ORDER BY name ASC';
    
    const results = await this.db.executeSql(query, params);
    return results[0].rows.raw();
  }

  async getNearbyResources(latitude, longitude, radiusKm = 50) {
    // Simple distance calculation (Haversine formula in SQL)
    const results = await this.db.executeSql(`
      SELECT *,
        (6371 * acos(cos(radians(?)) * cos(radians(latitude)) * 
        cos(radians(longitude) - radians(?)) + sin(radians(?)) * 
        sin(radians(latitude)))) AS distance
      FROM safety_resources
      WHERE is_active = 1 AND latitude IS NOT NULL AND longitude IS NOT NULL
      HAVING distance < ?
      ORDER BY distance ASC
    `, [latitude, longitude, latitude, radiusKm]);
    
    return results[0].rows.raw();
  }

  /**
   * Alert History Operations
   */
  async logAlert(alert) {
    const { sentTo, message, latitude, longitude, smsStatus, platform, success } = alert;
    const result = await this.db.executeSql(
      'INSERT INTO alert_history (sent_to, message, latitude, longitude, sms_status, platform, success) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [sentTo, message, latitude || null, longitude || null, smsStatus || 'sent', platform || 'unknown', success ? 1 : 0]
    );
    return result[0].insertId;
  }

  async getAlertHistory(limit = 20) {
    const results = await this.db.executeSql(
      'SELECT * FROM alert_history ORDER BY sent_at DESC LIMIT ?',
      [limit]
    );
    return results[0].rows.raw();
  }

  async getAlertStats() {
    const results = await this.db.executeSql(`
      SELECT 
        COUNT(*) as total_alerts,
        SUM(success) as successful_alerts,
        MAX(sent_at) as last_alert
      FROM alert_history
    `);
    return results[0].rows.item(0);
  }

  /**
   * Seed sample safety resources (for Ghana)
   */
  async seedSafetyResources() {
    const resources = [
      {
        name: 'Domestic Violence and Victim Support Unit (DOVVSU) - Sunyani',
        type: 'police',
        address: 'Ghana Police Service, Sunyani',
        phone: '0352022826',
        latitude: 7.3396,
        longitude: -2.3266,
        hours: '24/7',
        description: 'Specialized unit for domestic violence cases',
      },
      {
        name: 'Sunyani Regional Hospital',
        type: 'hospital',
        address: 'Hospital Road, Sunyani',
        phone: '0352027274',
        latitude: 7.3331,
        longitude: -2.3297,
        hours: '24/7',
        description: 'Emergency medical services available',
      },
      {
        name: 'ARK Foundation Ghana - Shelter',
        type: 'shelter',
        address: 'Sunyani, Bono Region',
        phone: '0244000000',
        latitude: 7.3396,
        longitude: -2.3166,
        hours: '24/7',
        description: 'Safe shelter for domestic violence victims',
      },
      {
        name: 'Department of Social Welfare',
        type: 'counseling',
        address: 'Sunyani Municipal Assembly',
        phone: '0352027155',
        latitude: 7.3406,
        longitude: -2.3286,
        hours: 'Mon-Fri: 8AM-5PM',
        description: 'Counseling and support services',
      },
    ];

    for (const resource of resources) {
      try {
        await this.addSafetyResource(resource);
      } catch (error) {
        // Resource might already exist
        console.log('Resource already exists:', resource.name);
      }
    }

    console.log('Safety resources seeded');
  }

  /**
   * Utility: Clear all data (for testing or reset)
   */
  async clearAllData() {
    await this.db.executeSql('DELETE FROM emergency_contacts');
    await this.db.executeSql('DELETE FROM alert_history');
    console.log('All data cleared');
  }

  /**
   * Utility: Reset database (drop and recreate tables)
   */
  async resetDatabase() {
    await this.db.executeSql('DROP TABLE IF EXISTS emergency_contacts');
    await this.db.executeSql('DROP TABLE IF EXISTS safety_resources');
    await this.db.executeSql('DROP TABLE IF EXISTS alert_history');
    await this.createTables();
    console.log('Database reset complete');
  }

  /**
   * Close database connection
   */
  async closeDatabase() {
    if (this.db) {
      await this.db.close();
      console.log('Database closed');
    }
  }
}

export const DatabaseService = new DatabaseServiceClass();
