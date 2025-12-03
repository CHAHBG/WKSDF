import React from 'react';
import { View, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../constants/theme';

import HomeScreen from '../screens/HomeScreen';
import InventoryScreen from '../screens/InventoryScreen';
import TransferListScreen from '../screens/TransferListScreen';
import SalesScreen from '../screens/SalesScreen';

import { useAuth } from '../contexts/AuthContext';

const Tab = createBottomTabNavigator();

export default function MainTabNavigator() {
    const { isAgent } = useAuth();

    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName;

                    if (route.name === 'Dashboard') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Inventory') {
                        iconName = focused ? 'cube' : 'cube-outline';
                    } else if (route.name === 'Mobile Money') {
                        iconName = focused ? 'wallet' : 'wallet-outline';
                    } else if (route.name === 'Sales') {
                        iconName = focused ? 'cash' : 'cash-outline';
                    }

                    return (
                        <View style={{
                            alignItems: 'center',
                            justifyContent: 'center',
                            top: Platform.OS === 'ios' ? 10 : 0,
                        }}>
                            <Ionicons name={iconName} size={size} color={color} />
                        </View>
                    );
                },
                tabBarActiveTintColor: COLORS.accent,
                tabBarInactiveTintColor: COLORS.textLight,
                tabBarStyle: {
                    position: 'absolute',
                    bottom: 10,
                    left: 15,
                    right: 15,
                    elevation: 0,
                    backgroundColor: 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 20,
                    height: 70,
                    ...SHADOWS.medium,
                    borderTopWidth: 0,
                },
                tabBarShowLabel: false,
                headerShown: false,
            })}
        >
            <Tab.Screen name="Dashboard" component={HomeScreen} />
            {!isAgent() && (
                <Tab.Screen name="Inventory" component={InventoryScreen} />
            )}
            <Tab.Screen name="Sales" component={SalesScreen} />
            <Tab.Screen name="Mobile Money" component={TransferListScreen} />
        </Tab.Navigator>
    );
}
