/**
 * Emergency Alert Screen  
 * One-touch SOS with SMS alerts and GPS location
 * Works 100% offline
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SIZES } from '../constants';
import { EncryptionService } from '../services/EncryptionService';
import { DatabaseService } from '../services/DatabaseService';
import { AlertService } from '../services/AlertService';
import { LocationService } from '../services/LocationService';

const EmergencyAlertScreen = () => {
  const [isSending, setIsSending] = useState(false);
  const [canSendSMS, setCanSendSMS] = useState(true);
  const [contactCount, setContactCount] = useState(0);

  useEffect(() => {
    checkSMSCapability();
    loadContactCount();
  }, []);

  const checkSMSCapability = async () => {
    const status = await AlertService.getSMSStatus();
    setCanSendSMS(status.available);
    if (!status.available) {
      Alert.alert('Warning', status.message);
    }
  };

  const loadContactCount = async () => {
    const contacts = await EncryptionService.retrieveEmergencyContacts();
    setContactCount(contacts?.length || 0);
  };

  const sendEmergencyAlert = async () => {
    // One confirmation dialog
    Alert.alert(
      '🚨 Send Emergency Alerts?',
      'This will send SMS with your location to all emergency contacts.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'SEND ALERTS',
          style: 'destructive',
          onPress: performEmergencyAlert,
        },
      ]
    );
  };

  const performEmergencyAlert = async () => {
    setIsSending(true);

    try {
      // Step 1: Get GPS location (works offline)
      const locationResult = await LocationService.getLocationForEmergency();
      
      if (!locationResult.success) {
        // Ask if user wants to send anyway without location
        Alert.alert(
          'Location Unavailable',
          `${locationResult.message}\n\nSend alert without location?`,
          [
            { text: 'Cancel', style: 'cancel', onPress: () => setIsSending(false) },
            {
              text: 'Send Anyway',
              onPress: () => sendAlertWithoutLocation(),
            },
          ]
        );
        return;
      }

      const location = locationResult.location;

      // Step 2: Get emergency contacts
      const contacts = await EncryptionService.retrieveEmergencyContacts();
      
      if (!contacts || contacts.length === 0) {
        Alert.alert(
          'No Contacts',
          'Please add emergency contacts in Settings before using SOS.',
          [{ text: 'OK', onPress: () => setIsSending(false) }]
        );
        return;
      }

      // Step 3: Get user info
      const userName = await EncryptionService.retrieveUserName() || 'SafePath User';
      const userPhone = await EncryptionService.retrieveUserPhone() || 'Unknown';

      // Step 4: Send SMS alerts to ALL contacts
      const result = await AlertService.sendEmergencyAlerts(
        contacts,
        location,
        userName,
        userPhone
      );

      // Step 5: Log to database
      if (result.success) {
        await DatabaseService.logAlert({
          sentTo: contacts.map(c => c.name).join(', '),
          message: AlertService.formatEmergencyMessage(userName, userPhone, location),
          latitude: location.latitude,
          longitude: location.longitude,
          smsStatus: 'sent',
          platform: result.platform,
          success: true,
        });

        // Show success with option to call
        showSuccessDialog(contacts);
      }

    } catch (error) {
      console.error('Emergency alert error:', error);
      Alert.alert(
        'Alert Failed',
        'Failed to send emergency alerts. Please try again or call contacts directly.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsSending(false);
    }
  };

  const sendAlertWithoutLocation = async () => {
    const contacts = await EncryptionService.retrieveEmergencyContacts();
    const userName = await EncryptionService.retrieveUserName() || 'SafePath User';
    const userPhone = await EncryptionService.retrieveUserPhone() || 'Unknown';

    await AlertService.sendEmergencyAlerts(contacts, null, userName, userPhone);
    setIsSending(false);
  };

  const showSuccessDialog = (contacts) => {
    const firstContact = contacts[0];
    
    Alert.alert(
      '✓ Emergency Alerts Sent!',
      `SMS sent to ${contacts.length} contact(s).\nThey have your location.\n\nCall ${firstContact.name}?`,
      [
        { text: 'Not Now', style: 'cancel' },
        {
          text: `Call ${firstContact.name}`,
          onPress: () => {
            // Open phone dialer
            const phoneUrl = `tel:${firstContact.phone}`;
            Linking.openURL(phoneUrl).catch(err => 
              Alert.alert('Error', 'Cannot make phone calls on this device')
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Emergency Alert</Text>
        <Text style={styles.subtitle}>
          {contactCount > 0 
            ? `${contactCount} contact${contactCount > 1 ? 's' : ''} will be notified`
            : 'No contacts configured'
          }
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <TouchableOpacity
          style={[
            styles.sosButton,
            (isSending || !canSendSMS || contactCount === 0) && styles.sosButtonDisabled
          ]}
          onPress={sendEmergencyAlert}
          disabled={isSending || !canSendSMS || contactCount === 0}
          activeOpacity={0.8}
        >
          {isSending ? (
            <>
              <ActivityIndicator size="large" color={COLORS.white} />
              <Text style={styles.sosSubtext}>Sending alerts...</Text>
            </>
          ) : (
            <>
              <Icon name="alert-octagon" size={80} color={COLORS.white} />
              <Text style={styles.sosText}>SOS</Text>
              <Text style={styles.sosSubtext}>Send Emergency Alert</Text>
            </>
          )}
        </TouchableOpacity>

        <View style={styles.infoCard}>
          <Icon name="information-outline" size={24} color={COLORS.primary} />
          <View style={styles.infoTextContainer}>
            <Text style={styles.infoTitle}>What happens when you press SOS:</Text>
            <Text style={styles.infoItem}>• Gets your GPS location (works offline)</Text>
            <Text style={styles.infoItem}>• Sends SMS to all emergency contacts</Text>
            <Text style={styles.infoItem}>• Includes clickable map link</Text>
            <Text style={styles.infoItem}>• Shows your phone number</Text>
            <Text style={styles.infoItem}>• No internet required</Text>
          </View>
        </View>

        {contactCount === 0 && (
          <View style={styles.warningCard}>
            <Icon name="alert" size={24} color={COLORS.warning} />
            <Text style={styles.warningText}>
              Please add emergency contacts in Settings before using SOS
            </Text>
          </View>
        )}

        <View style={styles.tipCard}>
          <Icon name="lightbulb-on-outline" size={20} color={COLORS.success} />
          <Text style={styles.tipText}>
            Tip: Press SOS only in real emergencies. All contacts will receive SMS immediately.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    padding: SIZES.padding * 2,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray,
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  subtitle: {
    fontSize: SIZES.body,
    color: COLORS.gray,
    marginTop: 4,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  sosButton: {
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 10,
    marginVertical: SIZES.margin * 2,
  },
  sosButtonDisabled: {
    opacity: 0.5,
    backgroundColor: COLORS.gray,
  },
  sosText: {
    fontSize: 52,
    fontWeight: 'bold',
    color: COLORS.white,
    marginTop: 12,
    letterSpacing: 2,
  },
  sosSubtext: {
    fontSize: SIZES.body,
    color: COLORS.white,
    marginTop: 6,
    opacity: 0.9,
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.white,
    padding: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    marginTop: SIZES.margin * 2,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  infoTextContainer: {
    flex: 1,
    marginLeft: SIZES.margin,
  },
  infoTitle: {
    fontSize: SIZES.body,
    color: COLORS.darkGray,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  infoItem: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
    lineHeight: 20,
    marginLeft: 4,
  },
  warningCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.warning + '20',
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginTop: SIZES.margin,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
  },
  warningText: {
    flex: 1,
    marginLeft: SIZES.margin,
    fontSize: SIZES.caption,
    color: COLORS.darkGray,
    lineHeight: 18,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.success + '10',
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginTop: SIZES.margin,
    width: '100%',
  },
  tipText: {
    flex: 1,
    marginLeft: SIZES.margin,
    fontSize: SIZES.caption,
    color: COLORS.darkGray,
    lineHeight: 18,
    fontStyle: 'italic',
  },
});

export default EmergencyAlertScreen;
