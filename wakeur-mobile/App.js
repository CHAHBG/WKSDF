import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './contexts/AuthContext';

// Import screens
import LoginScreen from './screens/LoginScreen';
import SignUpScreen from './screens/SignUpScreen';
import MainTabNavigator from './navigation/MainTabNavigator';
import AddProductScreen from './screens/AddProductScreen';
import EditProductScreen from './screens/EditProductScreen';
import TransactionEntryScreen from './screens/TransactionEntryScreen';
import DailyClosingScreen from './screens/DailyClosingScreen';
import ShopSetupScreen from './screens/ShopSetupScreen';
import AgentManagementScreen from './screens/AgentManagementScreen';
import AnalyticsScreen from './screens/AnalyticsScreen';
import CreateTransactionScreen from './screens/CreateTransactionScreen';

const Stack = createStackNavigator();

const AppContent = () => {
  const { user, userProfile, loading } = useAuth();

  if (loading) {
    return null; // Or a splash screen
  }

  // Not logged in - show auth screens
  if (!user) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
      </Stack.Navigator>
    );
  }

  // Logged in but no shop setup - show shop setup
  if (!userProfile || !userProfile.shop_id) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ShopSetup" component={ShopSetupScreen} />
      </Stack.Navigator>
    );
  }

  // Logged in with shop - show main app
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Main" component={MainTabNavigator} />
      <Stack.Screen name="AddProduct" component={AddProductScreen} />
      <Stack.Screen name="EditProduct" component={EditProductScreen} />
      <Stack.Screen name="TransactionEntry" component={TransactionEntryScreen} />
      <Stack.Screen name="CreateTransaction" component={CreateTransactionScreen} />
      <Stack.Screen name="DailyClosing" component={DailyClosingScreen} />
      <Stack.Screen name="AgentManagement" component={AgentManagementScreen} />
      <Stack.Screen name="Analytics" component={AnalyticsScreen} />
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer>
          <AppContent />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
