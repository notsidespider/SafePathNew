/**
 * Permissions Service
 * Handles all device permissions (Location, SMS)
 */

import { Platform, PermissionsAndroid, Alert } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';

class PermissionsServiceClass {
  /**
   * Request initial permissions needed for the app
   */
  async requestInitialPermissions() {
    try {
      await this.requestLocationPermission();
      // SMS permission will be requested when user uses SOS feature
    } catch (error) {
      console.error('Error requesting initial permissions:', error);
    }
  }

  /**
   * Request Location Permission
   */
  async requestLocationPermission() {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'SafePath needs access to your location for emergency alerts',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        console.warn('Location permission error:', err);
        return false;
      }
    } else {
      // iOS
      const result = await request(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      return result === RESULTS.GRANTED;
    }
  }

  /**
   * Check if location permission is granted
   */
  async checkLocationPermission() {
    if (Platform.OS === 'android') {
      const granted = await PermissionsAndroid.check(
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
      );
      return granted;
    } else {
      const result = await check(PERMISSIONS.IOS.LOCATION_WHEN_IN_USE);
      return result === RESULTS.GRANTED;
    }
  }

  /**
   * Request SMS Permission (Android only)
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
    return true; // iOS uses share sheet
  }

  /**
   * Show permission denied alert
   */
  showPermissionDeniedAlert(permissionName) {
    Alert.alert(
      'Permission Required',
      `${permissionName} permission is required for this feature. Please enable it in your device settings.`,
      [{ text: 'OK' }]
    );
  }
}

export const PermissionsService = new PermissionsServiceClass();
