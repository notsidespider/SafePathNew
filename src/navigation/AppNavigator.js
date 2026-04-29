/**
 * App Navigator
 * Navigation structure with bottom tabs
 */

import React, { useState, useEffect } from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

// Import screens
import CalculatorScreen from '../screens/CalculatorScreen';
import SetupScreen from '../screens/SetupScreen';
import EmergencyAlertScreen from '../screens/EmergencyAlertScreen';
import SafeHavenMapScreen from '../screens/SafeHavenMapScreen';
import MyJournalScreen from '../screens/MyJournalScreen';
import SettingsScreen from '../screens/SettingsScreen';

import { EncryptionService } from '../services/EncryptionService';
import { COLORS } from '../constants';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main app with bottom tabs
const MainTabs = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.gray,
        tabBarStyle: {
          paddingBottom: 5,
          paddingTop: 5,
          height: 60,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="SOS"
        component={EmergencyAlertScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="alert-octagon" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="SafeHaven"
        component={SafeHavenMapScreen}
        options={{
          tabBarLabel: 'Map',
          tabBarIcon: ({ color, size }) => (
            <Icon name="map-marker-radius" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Journal"
        component={MyJournalScreen}
        options={{
          tabBarIcon: ({ color, size}) => (
            <Icon name="book-open-variant" size={size} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <Icon name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

const AppNavigator = () => {
  const [isFirstLaunch, setIsFirstLaunch] = useState(null);

  useEffect(() => {
    checkFirstLaunch();
  }, []);

  const checkFirstLaunch = async () => {
    const passcode = await EncryptionService.retrievePasscode();
    setIsFirstLaunch(!passcode);
  };

  if (isFirstLaunch === null) {
    return null; // Loading
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName={isFirstLaunch ? 'Setup' : 'Calculator'}
    >
      {isFirstLaunch ? (
        <Stack.Screen name="Setup" component={SetupScreen} />
      ) : null}
      
      <Stack.Screen name="Calculator" component={CalculatorScreen} />
      <Stack.Screen name="Main" component={MainTabs} />
    </Stack.Navigator>
  );
};

export default AppNavigator;
