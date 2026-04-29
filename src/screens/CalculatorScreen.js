/**
 * Calculator Screen
 * Disguised entry point that looks like a normal calculator
 * Secret passcode unlocks the real app
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Alert,
  StatusBar,
} from 'react-native';
import { EncryptionService } from '../services/EncryptionService';
import { COLORS, SIZES } from '../constants';

const { width } = Dimensions.get('window');
const BUTTON_SIZE = width / 4 - 12;

const CalculatorScreen = ({ navigation }) => {
  const [display, setDisplay] = useState('0');
  const [secretInput, setSecretInput] = useState('');
  const [currentValue, setCurrentValue] = useState('0');
  const [previousValue, setPreviousValue] = useState('');
  const [operation, setOperation] = useState('');

  useEffect(() => {
    checkPasscode();
  }, []);

  const checkPasscode = async () => {
    const passcode = await EncryptionService.retrievePasscode();
    if (!passcode) {
      // First time setup needed
      navigation.replace('Setup');
    }
  };

  const handleNumberPress = (num) => {
    // Add to secret input (only numbers count for PIN)
    const newSecretInput = secretInput + num;
    setSecretInput(newSecretInput);

    // Check if 3-digit PIN matches
    if (newSecretInput.length === 3) {
      checkSecretPasscode(newSecretInput);
    } else if (newSecretInput.length > 3) {
      // Reset if more than 3 digits entered
      setSecretInput('');
    }

    // Normal calculator logic
    if (currentValue === '0' || currentValue === 'Error') {
      setCurrentValue(num);
      setDisplay(num);
    } else {
      const newValue = currentValue + num;
      setCurrentValue(newValue);
      setDisplay(newValue);
    }
  };

  const checkSecretPasscode = async (input) => {
    const passcode = await EncryptionService.retrievePasscode();
    
    if (input === passcode) {
      // Correct 3-digit PIN! Navigate to main app
      setSecretInput('');
      setDisplay('0');
      setCurrentValue('0');
      navigation.replace('Main');
    } else {
      // Wrong PIN, reset secret input
      setSecretInput('');
    }
  };

  const handleOperationPress = (op) => {
    // Operations clear the secret input (only numbers count)
    setSecretInput('');

    if (currentValue !== 'Error') {
      if (previousValue && operation) {
        calculateResult();
      }
      setPreviousValue(currentValue);
      setOperation(op);
      setCurrentValue('0');
      setDisplay(currentValue + ' ' + op);
    }
  };

  const handleEqualsPress = () => {
    // Equals clears the secret input
    setSecretInput('');
    calculateResult();
  };

  const calculateResult = () => {
    try {
      const prev = parseFloat(previousValue);
      const current = parseFloat(currentValue);
      let result;

      switch (operation) {
        case '+':
          result = prev + current;
          break;
        case '-':
          result = prev - current;
          break;
        case '×':
          result = prev * current;
          break;
        case '÷':
          result = current !== 0 ? prev / current : 'Error';
          break;
        default:
          return;
      }

      const displayResult = result === 'Error' ? 'Error' : result.toString();
      setDisplay(displayResult);
      setCurrentValue(displayResult);
      setPreviousValue('');
      setOperation('');
    } catch (error) {
      setDisplay('Error');
      setCurrentValue('Error');
    }
  };

  const handleClearPress = () => {
    setDisplay('0');
    setCurrentValue('0');
    setPreviousValue('');
    setOperation('');
    setSecretInput('');
  };

  const handleBackspacePress = () => {
    if (secretInput.length > 0) {
      setSecretInput(secretInput.slice(0, -1));
    }

    if (currentValue.length > 1) {
      const newValue = currentValue.slice(0, -1);
      setCurrentValue(newValue);
      setDisplay(newValue);
    } else {
      setCurrentValue('0');
      setDisplay('0');
    }
  };

  const renderButton = (label, onPress, style = {}, textStyle = {}) => (
    <TouchableOpacity
      style={[styles.button, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.buttonText, textStyle]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.darkGray} />
      
      {/* Display */}
      <View style={styles.displayContainer}>
        <Text style={styles.displayText} numberOfLines={1} adjustsFontSizeToFit>
          {display}
        </Text>
      </View>

      {/* Buttons */}
      <View style={styles.buttonsContainer}>
        {/* Row 1 */}
        <View style={styles.row}>
          {renderButton('C', handleClearPress, styles.functionButton)}
          {renderButton('⌫', handleBackspacePress, styles.functionButton)}
          {renderButton('%', () => {}, styles.functionButton)}
          {renderButton('÷', () => handleOperationPress('÷'), styles.operatorButton)}
        </View>

        {/* Row 2 */}
        <View style={styles.row}>
          {renderButton('7', () => handleNumberPress('7'))}
          {renderButton('8', () => handleNumberPress('8'))}
          {renderButton('9', () => handleNumberPress('9'))}
          {renderButton('×', () => handleOperationPress('×'), styles.operatorButton)}
        </View>

        {/* Row 3 */}
        <View style={styles.row}>
          {renderButton('4', () => handleNumberPress('4'))}
          {renderButton('5', () => handleNumberPress('5'))}
          {renderButton('6', () => handleNumberPress('6'))}
          {renderButton('-', () => handleOperationPress('-'), styles.operatorButton)}
        </View>

        {/* Row 4 */}
        <View style={styles.row}>
          {renderButton('1', () => handleNumberPress('1'))}
          {renderButton('2', () => handleNumberPress('2'))}
          {renderButton('3', () => handleNumberPress('3'))}
          {renderButton('+', () => handleOperationPress('+'), styles.operatorButton)}
        </View>

        {/* Row 5 */}
        <View style={styles.row}>
          {renderButton('0', () => handleNumberPress('0'), styles.zeroButton)}
          {renderButton('.', () => handleNumberPress('.'))}
          {renderButton('=', handleEqualsPress, styles.equalsButton)}
        </View>
      </View>

      {/* Subtle hint (can be removed in production) */}
      <Text style={styles.hintText}>Calculator</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.darkGray,
  },
  displayContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    padding: SIZES.padding * 2,
    backgroundColor: COLORS.darkGray,
  },
  displayText: {
    fontSize: 56,
    color: COLORS.white,
    fontWeight: '300',
  },
  buttonsContainer: {
    padding: 8,
    backgroundColor: COLORS.black,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  button: {
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: BUTTON_SIZE / 2,
    marginHorizontal: 4,
  },
  buttonText: {
    fontSize: 28,
    color: COLORS.white,
    fontWeight: '400',
  },
  functionButton: {
    backgroundColor: '#A5A5A5',
  },
  operatorButton: {
    backgroundColor: COLORS.primary,
  },
  equalsButton: {
    backgroundColor: COLORS.primary,
  },
  zeroButton: {
    width: BUTTON_SIZE * 2 + 8,
  },
  hintText: {
    textAlign: 'center',
    color: COLORS.gray,
    fontSize: 11,
    paddingVertical: 8,
    backgroundColor: COLORS.black,
    opacity: 0.6,
  },
});

export default CalculatorScreen;
