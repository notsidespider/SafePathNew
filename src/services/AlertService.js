/**
 * Alert Service
 * Handles emergency SMS alerts with GPS location
 * Works 100% offline using cellular network
 */

import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import { ALERT_MESSAGES, APP_CONFIG } from '../constants';

class AlertServiceClass {
  constructor() {
    this.isAlertInProgress = false;
  }

  /**
   * Request SMS permission (Android only - iOS uses share sheet)
   */
  async requestSMSPermission() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.SEND_SMS,
          {
            title: 'SMS Permission',
            message: 'SafePath needs permission to send emergency SMS alerts',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('SMS permission error:', err);
        return false;
      }
    }
    return true;
  }

  /**
   * Check if SMS permission is granted
   */
  async checkSMSPermission() {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.SEND_SMS
      );
      return granted;
    }
    return true;
  }

  /**
   * Format emergency SMS message
   */
  formatEmergencyMessage(userName, userPhone, location) {
    const now = new Date();
    const time = now.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
    const date = now.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });

    let message = ALERT_MESSAGES.DEFAULT_TEMPLATE
      .replace('{userName}', userName || 'SafePath User')
      .replace('{userPhone}', userPhone || 'Unknown')
      .replace(/{latitude}/g, location?.latitude?.toFixed(6) || 'Unknown')
      .replace(/{longitude}/g, location?.longitude?.toFixed(6) || 'Unknown')
      .replace('{time}', time)
      .replace('{date}', date);

    return message;
  }

  /**
   * Send SMS to a single contact (Android)
   * Uses Linking API to open SMS app with pre-filled message
   */
  async sendSMSAndroid(phoneNumber, message) {
    try {
      return await this.openSMSApp(phoneNumber, message);
    } catch (error) {
      console.error('Android SMS error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Open SMS app with pre-filled message (iOS & Android)
   */
  async openSMSApp(phoneNumber, message) {
    try {
      const separator = Platform.OS === 'ios' ? '&' : '?';
      const url = `sms:${phoneNumber}${separator}body=${encodeURIComponent(message)}`;

      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
        return { success: true, method: 'sms_app' };
      } else {
        throw new Error('Cannot open SMS app');
      }
    } catch (error) {
      console.error('Open SMS app error:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send SMS to a single contact (works for both platforms)
   */
  async sendToContact(contact, userName, userPhone, location) {
    const message = this.formatEmergencyMessage(userName, userPhone, location);

    if (Platform.OS === 'android') {
      return await this.sendSMSAndroid(contact.phone, message);
    } else {
      return await this.openSMSApp(contact.phone, message);
    }
  }

  /**
   * Send emergency alerts to all contacts
   * Main function called when SOS is pressed
   */
  async sendEmergencyAlerts(contacts, location, userName, userPhone) {
    if (this.isAlertInProgress) {
      Alert.alert('Alert in Progress', 'Please wait for current alert to complete');
      return { success: false, error: 'Alert already in progress' };
    }

    if (!contacts || contacts.length === 0) {
      Alert.alert('No Contacts', 'Please add emergency contacts in Settings');
      return { success: false, error: 'No contacts configured' };
    }

    this.isAlertInProgress = true;

    try {
      const results = [];
      const message = this.formatEmergencyMessage(userName, userPhone, location);

      if (Platform.OS === 'android') {
        for (const contact of contacts) {
          try {
            const result = await this.sendSMSAndroid(contact.phone, message);
            results.push({
              contact: contact.name,
              phone: contact.phone,
              ...result,
            });
          } catch (error) {
            results.push({
              contact: contact.name,
              phone: contact.phone,
              success: false,
              error: error.message,
            });
          }
        }

        const successCount = results.filter(r => r.success).length;
        if (successCount === contacts.length) {
          Alert.alert(
            '✓ Alerts Sent!',
            `Emergency SMS sent to all ${contacts.length} contact(s)`,
            [{ text: 'OK' }]
          );
        } else if (successCount > 0) {
          Alert.alert(
            '⚠️ Partial Success',
            `Sent to ${successCount} of ${contacts.length} contacts`,
            [{ text: 'OK' }]
          );
        } else {
          throw new Error('Failed to send to any contacts');
        }
      } else {
        Alert.alert(
          'Send Emergency SMS',
          `SMS app will open for each contact. You must press "Send" for each one.\n\nFirst contact: ${contacts[0].name}`,
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Continue',
              onPress: async () => {
                await this.sendMultipleSMSiOS(contacts, message);
              },
            },
          ]
        );

        results.push({
          platform: 'iOS',
          method: 'manual_send',
          contacts: contacts.length,
        });
      }

      this.isAlertInProgress = false;
      return {
        success: true,
        results,
        platform: Platform.OS,
      };
    } catch (error) {
      console.error('Emergency alert error:', error);
      this.isAlertInProgress = false;

      Alert.alert(
        'Alert Failed',
        `Could not send emergency alerts: ${error.message}`,
        [{ text: 'OK' }]
      );

      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Send SMS to multiple contacts on iOS (sequential)
   */
  async sendMultipleSMSiOS(contacts, message) {
    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];

      await this.openSMSApp(contact.phone, message);

      if (i < contacts.length - 1) {
        await new Promise(resolve => {
          setTimeout(() => {
            Alert.alert(
              'Next Contact',
              `SMS sent to ${contact.name}. Send to next contact: ${contacts[i + 1].name}?`,
              [
                { text: 'Stop', style: 'cancel', onPress: () => resolve(false) },
                { text: 'Continue', onPress: () => resolve(true) },
              ]
            );
          }, 2000);
        });
      }
    }
  }

  /**
   * Get formatted message preview
   */
  getMessagePreview(userName, userPhone, location) {
    return this.formatEmergencyMessage(userName, userPhone, location);
  }

  /**
   * Validate phone number format
   */
  validatePhoneNumber(phone) {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length >= 9 && cleaned.length <= 15) {
      return true;
    }
    return false;
  }

  /**
   * Format phone number for Ghana
   */
  formatPhoneNumber(phone) {
    let cleaned = phone.replace(/\D/g, '');

    if (cleaned.startsWith('0')) {
      cleaned = '+233' + cleaned.substring(1);
    } else if (!cleaned.startsWith('+') && !cleaned.startsWith('233')) {
      cleaned = '+233' + cleaned;
    } else if (cleaned.startsWith('233') && !cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }

    return cleaned;
  }

  /**
   * Check if device can send SMS
   */
  async canSendSMS() {
    try {
      const canOpen = await Linking.canOpenURL('sms:');
      return canOpen;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get SMS capability status
   */
  async getSMSStatus() {
    const canSend = await this.canSendSMS();
    return {
      available: canSend,
      platform: Platform.OS,
      method: Platform.OS === 'android' ? 'SMS App (via Linking)' : 'SMS App (Manual)',
      message: canSend
        ? `Ready to send emergency SMS (${Platform.OS})`
        : 'SMS not available on this device',
    };
  }
}

export const AlertService = new AlertServiceClass();
