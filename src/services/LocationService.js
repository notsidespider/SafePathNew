/**
 * Location Service
 * Handles GPS location retrieval (works offline)
 */

import Geolocation from '@react-native-community/geolocation';
import { PermissionsService } from './PermissionsService';
import { APP_CONFIG } from '../constants';

class LocationServiceClass {
  /**
   * Get current GPS location
   * Works WITHOUT internet (uses GPS satellites)
   */
  async getCurrentLocation() {
    return new Promise(async (resolve, reject) => {
      // Check permission first
      const hasPermission = await PermissionsService.checkLocationPermission();
      
      if (!hasPermission) {
        const granted = await PermissionsService.requestLocationPermission();
        if (!granted) {
          reject(new Error('Location permission denied'));
          return;
        }
      }

      // Get location from GPS
      Geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy, altitude, speed } = position.coords;
          
          resolve({
            latitude,
            longitude,
            accuracy,
            altitude,
            speed,
            timestamp: position.timestamp,
          });
        },
        (error) => {
          console.error('Location error:', error);
          reject(error);
        },
        {
          enableHighAccuracy: APP_CONFIG.GPS_HIGH_ACCURACY,
          timeout: APP_CONFIG.GPS_TIMEOUT,
          maximumAge: APP_CONFIG.GPS_MAX_AGE,
          forceRequestLocation: true, // Force GPS even offline
        }
      );
    });
  }

  /**
   * Get location with user-friendly error handling
   */
  async getLocationForEmergency() {
    try {
      const location = await this.getCurrentLocation();
      return {
        success: true,
        location,
        message: 'Location obtained successfully',
      };
    } catch (error) {
      console.error('Emergency location error:', error);
      
      let message = 'Could not get your location';
      
      if (error.code === 1) {
        message = 'Location permission denied';
      } else if (error.code === 2) {
        message = 'Location unavailable - GPS might be off';
      } else if (error.code === 3) {
        message = 'Location request timed out';
      }
      
      return {
        success: false,
        location: null,
        error: error.message,
        message,
      };
    }
  }

  /**
   * Format location for display
   */
  formatLocation(location) {
    if (!location) return 'Unknown';
    
    return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
  }

  /**
   * Create Google Maps link
   */
  createMapLink(location) {
    if (!location) return '';
    
    return `https://maps.google.com/?q=${location.latitude},${location.longitude}`;
  }

  /**
   * Create geo: URI for native map apps
   */
  createGeoURI(location) {
    if (!location) return '';
    
    return `geo:${location.latitude},${location.longitude}`;
  }

  /**
   * Check if location services are enabled
   */
  async isLocationEnabled() {
    try {
      const hasPermission = await PermissionsService.checkLocationPermission();
      return hasPermission;
    } catch (error) {
      return false;
    }
  }

  /**
   * Calculate distance between two points (in kilometers)
   */
  calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius of Earth in kilometers
    const dLat = this.toRad(lat2 - lat1);
    const dLon = this.toRad(lon2 - lon1);
    
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;
    
    return distance;
  }

  toRad(degrees) {
    return degrees * (Math.PI / 180);
  }
}

export const LocationService = new LocationServiceClass();
