/**
 * Setup Screen
 * First-time setup wizard for new users
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { EncryptionService } from '../services/EncryptionService';
import { DatabaseService } from '../services/DatabaseService';
import { COLORS, SIZES } from '../constants';

const SetupScreen = ({ navigation }) => {
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [passcode, setPasscode] = useState('');
  const [confirmPasscode, setConfirmPasscode] = useState('');
  const [emergencyContacts, setEmergencyContacts] = useState([
    { name: '', phone: '', relationship: '' },
  ]);

  const handleNextStep = () => {
    if (step === 1) {
      if (!userName.trim()) {
        Alert.alert('Required', 'Please enter your name');
        return;
      }
      if (!userPhone.trim()) {
        Alert.alert('Required', 'Please enter your phone number');
        return;
      }
      if (userPhone.replace(/\D/g, '').length < 9) {
        Alert.alert('Invalid', 'Please enter a valid phone number');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!/^\d{3}$/.test(passcode)) {
        Alert.alert('Error', 'PIN must be exactly 3 digits (e.g., 911, 123, 555)');
        return;
      }
      if (passcode !== confirmPasscode) {
        Alert.alert('Error', 'PINs do not match');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      const validContacts = emergencyContacts.filter(
        c => c.name.trim() && c.phone.trim()
      );
      if (validContacts.length === 0) {
        Alert.alert('Required', 'Please add at least one emergency contact');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      finishSetup();
    }
  };

  const finishSetup = async () => {
    try {
      await EncryptionService.storeUserName(userName.trim());
      await EncryptionService.storeUserPhone(userPhone.trim());
      await EncryptionService.storePasscode(passcode);

      const validContacts = emergencyContacts.filter(
        c => c.name.trim() && c.phone.trim()
      );
      await EncryptionService.storeEmergencyContacts(validContacts);

      for (const contact of validContacts) {
        await DatabaseService.addEmergencyContact({
          name: contact.name.trim(),
          phone: contact.phone.trim(),
          relationship: contact.relationship.trim() || 'Emergency Contact',
          isPrimary: validContacts[0] === contact,
        });
      }

      await DatabaseService.seedSafetyResources();

      Alert.alert(
        'Setup Complete! ✓',
        `Welcome ${userName}!\n\nYour SafePath app is now ready.\n\nTo open: Type "${passcode}" in the calculator`,
        [
          {
            text: 'OK',
            onPress: () => navigation.replace('Calculator'),
          },
        ]
      );
    } catch (error) {
      console.error('Setup error:', error);
      Alert.alert('Error', 'Failed to complete setup. Please try again.');
    }
  };

  const addEmergencyContact = () => {
    if (emergencyContacts.length < 5) {
      setEmergencyContacts([...emergencyContacts, { name: '', phone: '', relationship: '' }]);
    } else {
      Alert.alert('Limit Reached', 'You can add up to 5 emergency contacts');
    }
  };

  const updateContact = (index, field, value) => {
    const updated = [...emergencyContacts];
    updated[index][field] = value;
    setEmergencyContacts(updated);
  };

  const removeContact = (index) => {
    if (emergencyContacts.length > 1) {
      const updated = emergencyContacts.filter((_, i) => i !== index);
      setEmergencyContacts(updated);
    }
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Icon name="account-circle" size={80} color={COLORS.primary} />
      <Text style={styles.title}>Your Information</Text>
      <Text style={styles.description}>
        This information will be included in emergency alerts
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Your Name"
        placeholderTextColor={COLORS.placeholder}
        value={userName}
        onChangeText={setUserName}
        autoCapitalize="words"
        autoFocus
      />

      <TextInput
        style={styles.input}
        placeholder="Your Phone Number"
        placeholderTextColor={COLORS.placeholder}
        value={userPhone}
        onChangeText={setUserPhone}
        keyboardType="phone-pad"
      />

      <View style={styles.exampleCard}>
        <Icon name="information-outline" size={20} color={COLORS.primary} />
        <Text style={styles.exampleText}>
          Emergency contacts will see: "{userName || 'Your Name'} needs help! Call: {userPhone || '0244123456'}"
        </Text>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Icon name="lock" size={80} color={COLORS.primary} />
      <Text style={styles.title}>Create 3-Digit PIN</Text>
      <Text style={styles.description}>
        Type this 3-digit number in the calculator to unlock SafePath
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Create PIN (e.g., 911)"
        placeholderTextColor={COLORS.placeholder}
        value={passcode}
        onChangeText={setPasscode}
        keyboardType="numeric"
        maxLength={3}
        autoFocus
      />

      <TextInput
        style={styles.input}
        placeholder="Confirm PIN"
        placeholderTextColor={COLORS.placeholder}
        value={confirmPasscode}
        onChangeText={setConfirmPasscode}
        keyboardType="numeric"
        maxLength={3}
      />

      <View style={styles.tipCard}>
        <Icon name="lightbulb-on" size={20} color={COLORS.warning} />
        <Text style={styles.tipText}>
          💡 Choose 3 numbers you'll remember: "911", "123", "555"
          {'\n'}Make it easy to type quickly in an emergency
        </Text>
      </View>
    </View>
  );

  const renderStep3 = () => (
    <ScrollView contentContainerStyle={styles.stepContainer} showsVerticalScrollIndicator={false}>
      <Icon name="account-group" size={80} color={COLORS.primary} />
      <Text style={styles.title}>Emergency Contacts</Text>
      <Text style={styles.description}>
        They will receive SMS alerts when you press SOS
      </Text>

      {emergencyContacts.map((contact, index) => (
        <View key={index} style={styles.contactCard}>
          <View style={styles.contactHeader}>
            <Text style={styles.contactNumber}>Contact {index + 1}</Text>
            {emergencyContacts.length > 1 && (
              <TouchableOpacity onPress={() => removeContact(index)}>
                <Icon name="close-circle" size={24} color={COLORS.danger} />
              </TouchableOpacity>
            )}
          </View>

          <TextInput
            style={styles.input}
            placeholder="Name (e.g., Mom, Sister)"
            placeholderTextColor={COLORS.placeholder}
            value={contact.name}
            onChangeText={(text) => updateContact(index, 'name', text)}
            autoCapitalize="words"
          />

          <TextInput
            style={styles.input}
            placeholder="Phone Number"
            placeholderTextColor={COLORS.placeholder}
            value={contact.phone}
            onChangeText={(text) => updateContact(index, 'phone', text)}
            keyboardType="phone-pad"
          />

          <TextInput
            style={styles.input}
            placeholder="Relationship (optional)"
            placeholderTextColor={COLORS.placeholder}
            value={contact.relationship}
            onChangeText={(text) => updateContact(index, 'relationship', text)}
            autoCapitalize="words"
          />
        </View>
      ))}

      {emergencyContacts.length < 5 && (
        <TouchableOpacity
          style={styles.addButton}
          onPress={addEmergencyContact}
        >
          <Icon name="plus-circle" size={24} color={COLORS.primary} />
          <Text style={styles.addButtonText}>Add Another Contact</Text>
        </TouchableOpacity>
      )}
    </ScrollView>
  );

  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Icon name="check-circle" size={80} color={COLORS.success} />
      <Text style={styles.title}>All Set! 🎉</Text>
      <Text style={styles.description}>
        SafePath is ready to keep you safe
      </Text>

      <View style={styles.summaryCard}>
        <View style={styles.summaryRow}>
          <Icon name="account" size={24} color={COLORS.primary} />
          <View style={styles.summaryText}>
            <Text style={styles.summaryLabel}>Your Name</Text>
            <Text style={styles.summaryValue}>{userName}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <Icon name="phone" size={24} color={COLORS.primary} />
          <View style={styles.summaryText}>
            <Text style={styles.summaryLabel}>Your Phone</Text>
            <Text style={styles.summaryValue}>{userPhone}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <Icon name="lock" size={24} color={COLORS.primary} />
          <View style={styles.summaryText}>
            <Text style={styles.summaryLabel}>Passcode</Text>
            <Text style={styles.summaryValue}>{"•".repeat(passcode.length)}</Text>
          </View>
        </View>

        <View style={styles.summaryRow}>
          <Icon name="account-group" size={24} color={COLORS.primary} />
          <View style={styles.summaryText}>
            <Text style={styles.summaryLabel}>Emergency Contacts</Text>
            <Text style={styles.summaryValue}>
              {emergencyContacts.filter(c => c.name.trim()).length} contact(s)
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.instructionCard}>
        <Text style={styles.instructionTitle}>How to Use SafePath:</Text>
        <Text style={styles.instructionText}>
          1. Open the calculator app{'\n'}
          2. Type your passcode: "{passcode}"{'\n'}
          3. App unlocks automatically{'\n'}
          4. Press SOS button in emergency{'\n'}
          5. All contacts get SMS with your location
        </Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />

      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(step / 4) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>Step {step} of 4</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && renderStep4()}
      </ScrollView>

      <View style={styles.navigationContainer}>
        {step > 1 && step < 4 && (
          <TouchableOpacity
            style={[styles.navButton, styles.backButton]}
            onPress={() => setStep(step - 1)}
          >
            <Icon name="arrow-left" size={20} color={COLORS.darkGray} />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.navButton, styles.nextButton, step > 1 && step < 4 && { flex: 1 }]}
          onPress={handleNextStep}
        >
          <Text style={styles.nextButtonText}>
            {step === 4 ? 'Finish Setup' : 'Next'}
          </Text>
          {step < 4 && <Icon name="arrow-right" size={20} color={COLORS.white} />}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.white,
  },
  progressContainer: {
    padding: SIZES.padding,
    backgroundColor: COLORS.white,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.lightGray,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: COLORS.primary,
  },
  progressText: {
    marginTop: 8,
    fontSize: SIZES.caption,
    color: COLORS.gray,
    textAlign: 'center',
  },
  content: {
    padding: SIZES.padding * 2,
  },
  stepContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: SIZES.h2,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginTop: SIZES.margin,
    marginBottom: SIZES.margin / 2,
    textAlign: 'center',
  },
  description: {
    fontSize: SIZES.body,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: SIZES.margin * 2,
    lineHeight: 22,
    paddingHorizontal: SIZES.padding,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: COLORS.lightGray,
    borderRadius: SIZES.radius,
    paddingHorizontal: SIZES.padding,
    marginBottom: SIZES.margin,
    fontSize: SIZES.body,
    backgroundColor: COLORS.white,
    color: COLORS.darkGray,
  },
  exampleCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.primary + '10',
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginTop: SIZES.margin,
    width: '100%',
  },
  exampleText: {
    flex: 1,
    marginLeft: SIZES.margin,
    fontSize: SIZES.caption,
    color: COLORS.darkGray,
    lineHeight: 18,
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: COLORS.warning + '10',
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
  },
  contactCard: {
    width: '100%',
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.margin,
  },
  contactHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SIZES.margin,
  },
  contactNumber: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.darkGray,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: SIZES.padding,
    marginTop: SIZES.margin,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: SIZES.radius,
    borderStyle: 'dashed',
  },
  addButtonText: {
    marginLeft: 8,
    fontSize: SIZES.body,
    color: COLORS.primary,
    fontWeight: '600',
  },
  summaryCard: {
    width: '100%',
    backgroundColor: COLORS.background,
    padding: SIZES.padding,
    borderRadius: SIZES.radius,
    marginBottom: SIZES.margin * 2,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SIZES.padding / 2,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.lightGray + '50',
    marginBottom: SIZES.margin,
  },
  summaryText: {
    flex: 1,
    marginLeft: SIZES.margin,
  },
  summaryLabel: {
    fontSize: SIZES.caption,
    color: COLORS.gray,
  },
  summaryValue: {
    fontSize: SIZES.body,
    color: COLORS.darkGray,
    fontWeight: '600',
    marginTop: 2,
  },
  instructionCard: {
    backgroundColor: COLORS.success + '10',
    padding: SIZES.padding * 1.5,
    borderRadius: SIZES.radius,
    width: '100%',
  },
  instructionTitle: {
    fontSize: SIZES.body,
    fontWeight: 'bold',
    color: COLORS.darkGray,
    marginBottom: SIZES.margin,
  },
  instructionText: {
    fontSize: SIZES.caption,
    color: COLORS.darkGray,
    lineHeight: 22,
  },
  navigationContainer: {
    flexDirection: 'row',
    padding: SIZES.padding,
    borderTopWidth: 1,
    borderTopColor: COLORS.lightGray,
    backgroundColor: COLORS.white,
  },
  navButton: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: SIZES.radius,
    flexDirection: 'row',
  },
  backButton: {
    backgroundColor: COLORS.background,
    marginRight: SIZES.margin / 2,
    paddingHorizontal: SIZES.padding * 2,
  },
  backButtonText: {
    fontSize: SIZES.body,
    color: COLORS.darkGray,
    fontWeight: '600',
    marginLeft: 4,
  },
  nextButton: {
    flex: 1,
    backgroundColor: COLORS.primary,
    marginLeft: SIZES.margin / 2,
  },
  nextButtonText: {
    fontSize: SIZES.body,
    color: COLORS.white,
    fontWeight: '600',
    marginRight: 4,
  },
});

export default SetupScreen;
