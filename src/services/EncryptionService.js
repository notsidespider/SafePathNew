/**
 * Encryption Service
 * Handles encryption and decryption of sensitive data
 */

import EncryptedStorage from 'react-native-encrypted-storage';
import { STORAGE_KEYS } from '../constants';

class EncryptionServiceClass {
  /**
   * Simple encryption using base64
   */
  encrypt(text) {
    try {
      const encoded = btoa(unescape(encodeURIComponent(text)));
      return encoded;
    } catch (error) {
      console.error('Encryption error:', error);
      return null;
    }
  }

  /**
   * Simple decryption using base64
   */
  decrypt(encryptedText) {
    try {
      if (!encryptedText) return null;
      const decoded = decodeURIComponent(escape(atob(encryptedText)));
      return decoded;
    } catch (error) {
      console.error('Decryption error:', error);
      return null;
    }
  }

  /**
   * Store encrypted data in secure storage
   */
  async storeSecure(key, value) {
    try {
      const encrypted = this.encrypt(JSON.stringify(value));
      await EncryptedStorage.setItem(key, encrypted);
      return true;
    } catch (error) {
      console.error('Secure storage error:', error);
      return false;
    }
  }

  /**
   * Retrieve and decrypt data from secure storage
   */
  async retrieveSecure(key) {
    try {
      const encrypted = await EncryptedStorage.getItem(key);
      if (!encrypted) return null;

      const decrypted = this.decrypt(encrypted);
      return JSON.parse(decrypted);
    } catch (error) {
      console.error('Secure retrieval error:', error);
      return null;
    }
  }

  /**
   * Remove item from secure storage
   */
  async removeSecure(key) {
    try {
      await EncryptedStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('Secure removal error:', error);
      return false;
    }
  }

  /**
   * Clear all secure storage
   */
  async clearSecureStorage() {
    try {
      await EncryptedStorage.clear();
      return true;
    } catch (error) {
      console.error('Clear secure storage error:', error);
      return false;
    }
  }

  /**
   * Store passcode securely
   */
  async storePasscode(passcode) {
    return await this.storeSecure(STORAGE_KEYS.PASSCODE, passcode);
  }

  /**
   * Retrieve passcode
   */
  async retrievePasscode() {
    return await this.retrieveSecure(STORAGE_KEYS.PASSCODE);
  }

  /**
   * Verify passcode
   */
  async verifyPasscode(inputPasscode) {
    const storedPasscode = await this.retrievePasscode();
    return storedPasscode === inputPasscode;
  }

  /**
   * Store emergency contacts securely
   */
  async storeEmergencyContacts(contacts) {
    return await this.storeSecure(STORAGE_KEYS.EMERGENCY_CONTACTS, contacts);
  }

  /**
   * Retrieve emergency contacts
   */
  async retrieveEmergencyContacts() {
    return await this.retrieveSecure(STORAGE_KEYS.EMERGENCY_CONTACTS);
  }

  /**
   * Store user name
   */
  async storeUserName(name) {
    return await this.storeSecure(STORAGE_KEYS.USER_NAME, name);
  }

  /**
   * Retrieve user name
   */
  async retrieveUserName() {
    return await this.retrieveSecure(STORAGE_KEYS.USER_NAME);
  }

  /**
   * Store user phone
   */
  async storeUserPhone(phone) {
    return await this.storeSecure(STORAGE_KEYS.USER_PHONE, phone);
  }

  /**
   * Retrieve user phone
   */
  async retrieveUserPhone() {
    return await this.retrieveSecure(STORAGE_KEYS.USER_PHONE);
  }
}

export const EncryptionService = new EncryptionServiceClass();
