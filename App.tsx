import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { StyleSheet } from 'react-native';
import { colors } from './src/utils/theme';

import HomeScreen     from './src/screens/HomeScreen';
import WardrobeScreen from './src/screens/WardrobeScreen';
import AvatarScreen   from './src/screens/AvatarScreen';
import StylistScreen  from './src/screens/StylistScreen';
import ProfileScreen  from './src/screens/ProfileScreen';
import FloatingTabBar from './src/components/FloatingTabBar';
import { WardrobeProvider } from './src/context/WardrobeContext';
import { AuthProvider }    from './src/context/AuthContext';
import type { RootTabParamList } from './src/types';

type RootStackParamList = { Main: undefined };

const Tab       = createBottomTabNavigator<RootTabParamList>();
const RootStack = createStackNavigator<RootStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"     component={HomeScreen}     />
      <Tab.Screen name="Wardrobe" component={WardrobeScreen} />
      <Tab.Screen name="Stylist"  component={StylistScreen}  />
      <Tab.Screen name="Avatar"   component={AvatarScreen}   />
      <Tab.Screen name="Profile"  component={ProfileScreen}  />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <WardrobeProvider>
            <NavigationContainer>
              <RootStack.Navigator screenOptions={{ headerShown: false }}>
                <RootStack.Screen name="Main" component={MainTabs} />
              </RootStack.Navigator>
            </NavigationContainer>
          </WardrobeProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
});
