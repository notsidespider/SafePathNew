/**
 * Settings Screen
 * Manage emergency contacts, passcode, and app settings
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { COLORS, SIZES } from '../constants';
import { EncryptionService } from '../services/EncryptionService';
import { DatabaseService } from '../services/DatabaseService';

const SettingsScreen = ({ navigation }) => {
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [emergencyContacts, setEmergencyContacts] = useState([]);
  const [alertHistory, setAlertHistory] = useState([]);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasscodeModal, setShowPasscodeModal] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);
  const [editingContact, setEditingContact] = useState(null);
  const [editingContactIndex, setEditingContactIndex] = useState(-1);

  const [editName, setEditName] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [newPasscode, setNewPasscode] = useState('');
  const [confirmNewPasscode, setConfirmNewPasscode] = useState('');
  const [contactName, setContactName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactRelationship, setContactRelationship] = useState('');

  useEffect(() => {
    loadUserData();
    loadEmergencyContacts();
    loadAlertHistory();
  }, []);

  const loadUserData = async () => {
    const name = await EncryptionService.retrieveUserName();
    const phone = await EncryptionService.retrieveUserPhone();
    setUserName(name || 'Not Set');
    setUserPhone(phone || 'Not Set');
  };

  const loadEmergencyContacts = async () => {
    const contacts = await EncryptionService.retrieveEmergencyContacts();
    setEmergencyContacts(contacts || []);
  };

  const loadAlertHistory = async () => {
    const history = await DatabaseService.getAlertHistory(5);
    setAlertHistory(history);
  };

  const handleEditProfile = () => {
    setEditName(userName);
    setEditPhone(userPhone);
    setShowEditModal(true);
  };

  const saveProfile = async () => {
    if (!editName.trim() || !editPhone.trim()) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }
    await EncryptionService.storeUserName(editName.trim());
    await EncryptionService.storeUserPhone(editPhone.trim());
    setUserName(editName.trim());
    setUserPhone(editPhone.trim());
    setShowEditModal(false);
    Alert.alert('Success', 'Profile updated successfully');
  };

  const handleChangePasscode = () => {
    setNewPasscode('');
    setConfirmNewPasscode('');
    setShowPasscodeModal(true);
  };

  const savePasscode = async () => {
    if (!/^\d{3}$/.test(newPasscode)) {
      Alert.alert('Error', 'PIN must be exactly 3 digits (e.g., 911, 123, 555)');
      return;
    }
    if (newPasscode !== confirmNewPasscode) {
      Alert.alert('Error', 'PINs do not match');
      return;
    }
    await EncryptionService.storePasscode(newPasscode);
    setShowPasscodeModal(false);
    Alert.alert('Success', `New PIN set!\n\nYour new PIN is: ${newPasscode}\n\nType this in the calculator to unlock SafePath.`);
  };

  const handleAddContact = () => {
    if (emergencyContacts.length >= 5) {
      Alert.alert('Limit Reached', 'You can have up to 5 emergency contacts');
      return;
    }
    setEditingContact(null);
    setEditingContactIndex(-1);
    setContactName('');
    setContactPhone('');
    setContactRelationship('');
    setShowContactModal(true);
  };

  const handleEditContact = (contact, index) => {
    setEditingContact(contact);
    setEditingContactIndex(index);
    setContactName(contact.name);
    setContactPhone(contact.phone);
    setContactRelationship(contact.relationship || '');
    setShowContactModal(true);
  };

  const saveContact = async () => {
    if (!contactName.trim() || !contactPhone.trim()) {
      Alert.alert('Error', 'Please enter name and phone number');
      return;
    }
    const newContact = {
      name: contactName.trim(),
      phone: contactPhone.trim(),
      relationship: contactRelationship.trim() || 'Emergency Contact',
    };
    let updatedContacts;
    if (editingContactIndex >= 0) {
      updatedContacts = [...emergencyContacts];
      updatedContacts[editingContactIndex] = newContact;
    } else {
      updatedContacts = [...emergencyContacts, newContact];
    }
    await EncryptionService.storeEmergencyContacts(updatedContacts);
    setEmergencyContacts(updatedContacts);
    setShowContactModal(false);
    Alert.alert('Success', editingContactIndex >= 0 ? 'Contact updated' : 'Contact added');
  };

  const deleteContact = (index) => {
    Alert.alert(
      'Delete Contact',
      `Remove ${emergencyContacts[index].name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = emergencyContacts.filter((_, i) => i !== index);
            await EncryptionService.storeEmergencyContacts(updated);
            setEmergencyContacts(updated);
            Alert.alert('Deleted', 'Contact removed');
          },
        },
      ]
    );
  };

  const viewAlertHistory = () => {
    if (alertHistory.length === 0) {
      Alert.alert('No History', 'No emergency alerts have been sent yet');
      return;
    }
    const historyText = alertHistory.map((alert, index) => {
      const date = new Date(alert.sent_at);
      return `${index + 1}. ${date.toLocaleDateString()} ${date.toLocaleTimeString()}\n   Sent to: ${alert.sent_to}\n   Status: ${alert.success ? 'Sent ✓' : 'Failed'}`;
    }).join('\n\n');
    Alert.alert('Alert History', historyText, [{ text: 'OK' }]);
  };

  const handleResetApp = () => {
    Alert.alert(
      'Reset SafePath',
      'This will delete all your data including contacts and settings. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await EncryptionService.clearSecureStorage();
            await DatabaseService.clearAllData();
            Alert.alert('Reset Complete', 'App has been reset', [
              { text: 'OK', onPress: () => navigation.replace('Setup') },
            ]);
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <TouchableOpacity
          style={styles.exitButton}
          onPress={() => navigation.replace('Calculator')}
        >
          <Icon name="exit-to-app" size={20} color={COLORS.danger} />
          <Text style={styles.exitText}>Exit</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Profile</Text>
          <View style={styles.profileCard}>
            <View style={styles.profileRow}>
              <Icon name="account" size={24} color={COLORS.primary} />
              <View style={styles.profileInfo}>
                <Text style={styles.profileLabel}>Name</Text>
                <Text style={styles.profileValue}>{userName}</Text>
              </View>
            </View>
            <View style={styles.profileRow}>
              <Icon name="phone" size={24} color={COLORS.primary} />
              <View style={styles.profileInfo}>
                <Text style={styles.profileLabel}>Phone</Text>
                <Text style={styles.profileValue}>{userPhone}</Text>
              </View>
            </View>
            <TouchableOpacity style={styles.editButton} onPress={handleEditProfile}>
              <Icon name="pencil" size={18} color={COLORS.primary} />
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Emergency Contacts</Text>
            <TouchableOpacity onPress={handleAddContact}>
              <Icon name="plus-circle" size={28} color={COLORS.primary} />
            </TouchableOpacity>
          </View>

          {emergencyContacts.length === 0 ? (
            <View style={styles.emptyCard}>
              <Icon name="account-alert" size={48} color={COLORS.lightGray} />
              <Text style={styles.emptyText}>No emergency contacts</Text>
              <TouchableOpacity style={styles.addFirstButton} onPress={handleAddContact}>
                <Text style={styles.addFirstButtonText}>Add First Contact</Text>
              </TouchableOpacity>
            </View>
          ) : (
            emergencyContacts.map((contact, index) => (
              <View key={index} style={styles.contactCard}>
                <View style={styles.contactInfo}>
                  <Icon name="account-circle" size={40} color={COLORS.primary} />
                  <View style={styles.contactDetails}>
                    <Text style={styles.contactName}>{contact.name}</Text>
                    <Text style={styles.contactPhone}>{contact.phone}</Text>
                    {contact.relationship && (
                      <Text style={styles.contactRelationship}>{contact.relationship}</Text>
                    )}
                  </View>
                </View>
                <View style={styles.contactActions}>
                  <TouchableOpacity onPress={() => handleEditContact(contact, index)}>
                    <Icon name="pencil" size={22} color={COLORS.primary} />
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => deleteContact(index)} style={{ marginLeft: 16 }}>
                    <Icon name="delete" size={22} color={COLORS.danger} />
                  </TouchableOpacity>
                </View>
              </View>
            ))
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Security</Text>
          <TouchableOpacity style={styles.option} onPress={handleChangePasscode}>
            <View style={styles.optionLeft}>
              <Icon name="lock-reset" size={24} color={COLORS.primary} />
              <Text style={styles.optionText}>Change Passcode</Text>
            </View>
            <Icon name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>History</Text>
          <TouchableOpacity style={styles.option} onPress={viewAlertHistory}>
            <View style={styles.optionLeft}>
              <Icon name="history" size={24} color={COLORS.primary} />
              <View>
                <Text style={styles.optionText}>Alert History</Text>
                <Text style={styles.optionSubtext}>
                  {alertHistory.length} alert{alertHistory.length !== 1 ? 's' : ''} sent
                </Text>
              </View>
            </View>
            <Icon name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <TouchableOpacity
            style={styles.option}
            onPress={() => Alert.alert(
              'SafePath v2.1',
              'Discreet Emergency Alert Application\n\nDeveloped by Group 9E\nUniversity of Energy and Natural Resources\n\nSupervisor: Mr. Jacob Mensah\n\n© 2026'
            )}
          >
            <View style={styles.optionLeft}>
              <Icon name="information" size={24} color={COLORS.primary} />
              <Text style={styles.optionText}>About SafePath</Text>
            </View>
            <Icon name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.option} onPress={handleResetApp}>
            <View style={styles.optionLeft}>
              <Icon name="restore" size={24} color={COLORS.danger} />
              <Text style={[styles.optionText, { color: COLORS.danger }]}>Reset App</Text>
            </View>
            <Icon name="chevron-right" size={24} color={COLORS.gray} />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Edit Profile Modal */}
      <Modal visible={showEditModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TextInput
              style={styles.input}
              placeholder="Your Name"
              placeholderTextColor={COLORS.placeholder}
              value={editName}
              onChangeText={setEditName}
              color={COLORS.darkGray}
            />
            <TextInput
              style={styles.input}
              placeholder="Your Phone"
              placeholderTextColor={COLORS.placeholder}
              value={editPhone}
              onChangeText={setEditPhone}
              keyboardType="phone-pad"
              color={COLORS.darkGray}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowEditModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveProfile}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Passcode Modal */}
      <Modal visible={showPasscodeModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change PIN</Text>
            <Text style={styles.modalSubtitle}>Enter a 3-digit number (e.g., 911, 123, 555)</Text>
            <TextInput
              style={styles.input}
              placeholder="New 3-Digit PIN"
              placeholderTextColor={COLORS.placeholder}
              value={newPasscode}
              onChangeText={setNewPasscode}
              keyboardType="numeric"
              maxLength={3}
              color={COLORS.darkGray}
            />
            <TextInput
              style={styles.input}
              placeholder="Confirm PIN"
              placeholderTextColor={COLORS.placeholder}
              value={confirmNewPasscode}
              onChangeText={setConfirmNewPasscode}
              keyboardType="numeric"
              maxLength={3}
              color={COLORS.darkGray}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowPasscodeModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={savePasscode}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Add/Edit Contact Modal */}
      <Modal visible={showContactModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingContactIndex >= 0 ? 'Edit Contact' : 'Add Contact'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="Name"
              placeholderTextColor={COLORS.placeholder}
              value={contactName}
              onChangeText={setContactName}
              color={COLORS.darkGray}
            />
            <TextInput
              style={styles.input}
              placeholder="Phone Number"
              placeholderTextColor={COLORS.placeholder}
              value={contactPhone}
              onChangeText={setContactPhone}
              keyboardType="phone-pad"
              color={COLORS.darkGray}
            />
            <TextInput
              style={styles.input}
              placeholder="Relationship (optional)"
              placeholderTextColor={COLORS.placeholder}
              value={contactRelationship}
              onChangeText={setContactRelationship}
              color={COLORS.darkGray}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowContactModal(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, styles.saveButton]}
                onPress={saveContact}
              >
                <Text style={styles.saveButtonText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  exitText: {
    marginLeft: 4,
    fontSize: SIZES.caption,
    color: COLORS.danger,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: SIZES.margin * 2,
    paddingHorizontal: SIZES.padding,
  },
  sectionTitle: {
    fontSize: SIZES.h4,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: SIZES.margin,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.margin,
  },
  profileCard: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray + '50',
  },
  profileInfo: {
    flex: 1,
    marginLeft: SIZES.margin,
  },
  profileLabel: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
  },
  profileValue: {
    fontSize: SIZES.body,
    color: COLORS.darkGray,
    fontWeight: '600',
    marginTop: 2,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SIZES.margin,
    padding: SIZES.padding / 2,
  },
  editButtonText: {
    marginLeft: 4,
    fontSize: SIZES.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  contactCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.margin,
  },
  contactInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactDetails: {
    flex: 1,
    marginLeft: SIZES.margin,
  },
  contactName: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  contactPhone: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
    marginTop: 2,
  },
  contactRelationship: {
    fontSize: SIZES.caption,
    color: COLORS.primary,
    marginTop: 2,
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: COLORS.white,
    padding: SIZES.padding * 3,
    borderRadius: SIZES.radius,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: SIZES.body,
    color: COLORS.gray,
    marginTop: SIZES.margin,
    marginBottom: SIZES.margin * 2,
  },
  addFirstButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SIZES.padding * 2,
    paddingVertical: SIZES.padding,
    borderRadius: SIZES.radius,
  },
  addFirstButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: 1,
  },
  optionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    marginLeft: SIZES.margin,
    fontSize: SIZES.body,
    color: COLORS.darkGray,
  },
  optionSubtext: {
    marginLeft: SIZES.margin,
    fontSize: SIZES.caption,
    color: COLORS.gray,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: SIZES.padding * 2,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: SIZES.radius * 2,
    padding: SIZES.padding * 2,
    width: '100%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: SIZES.h3,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: SIZES.margin * 2,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
    marginBottom: SIZES.margin,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    marginBottom: SIZES.margin,
    fontSize: SIZES.body,
    color: COLORS.darkGray,
    backgroundColor: COLORS.white,
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: SIZES.margin,
  },
  modalButton: {
    flex: 1,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: SIZES.radius,
  },
  cancelButton: {
    backgroundColor: COLORS.background,
    marginRight: SIZES.margin / 2,
  },
  cancelButtonText: {
    color: COLORS.darkGray,
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: COLORS.primary,
    marginLeft: SIZES.margin / 2,
  },
  saveButtonText: {
    color: COLORS.white,
    fontWeight: '600',
  },
});

export default SettingsScreen;
