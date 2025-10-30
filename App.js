import React, { useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import SplashScreen from './src/SplashScreen.js';
import LoginPage from './src/LoginPage.js';
import SigninPage from './src/SigninPage.js';
import Dashboard from './src/Dashboard.js';
import BusDetailsScreen from './src/BusDetailsScreen.js';
import ContactScreen from './src/ContactScreen.js';
import MapScreen from './src/MapScreen.js';
import TrackerScreen from './src/screens/TrackerScreen.js';

const Stack = createStackNavigator();

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [loggedInUser, setLoggedInUser] = useState(null);

  const handleSplashFinish = () => setShowSplash(false);
  const handleLoginSuccess = (user) => {
    setLoggedInUser(user);
  };
  const handleLogout = () => {
    setLoggedInUser(null);
  };

  if (showSplash) return <SplashScreen onFinish={handleSplashFinish} />;

  return (
    <NavigationContainer>
      <Stack.Navigator>
        {!loggedInUser ? (
          <>
            <Stack.Screen
              name="Login"
              options={{ headerShown: false }}
            >
              {props => (
                <LoginPage
                  {...props}
                  onLoginSuccess={handleLoginSuccess}
                  onNavigateToSignin={() => props.navigation.navigate('Signin')}
                />
              )}
            </Stack.Screen>
            <Stack.Screen
              name="Signin"
              component={SigninPage}
              options={{ headerTitle: 'Sign Up' }}
            />
          </>
        ) : (
          <>
            <Stack.Screen
              name="Dashboard"
              options={{ headerShown: false }}
            >
              {props => <Dashboard {...props} user={loggedInUser} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen
              name="Tracker"
              component={TrackerScreen}
              options={{ headerTitle: 'Live Bus Tracking' }}
            />
            <Stack.Screen
              name="Map"
              component={MapScreen}
              options={{ headerTitle: 'Track Bus Location' }}
            />
            <Stack.Screen
              name="BusDetails"
              component={BusDetailsScreen}
              options={{ headerTitle: 'Bus Details' }}
            />
            <Stack.Screen
              name="Contact"
              component={ContactScreen}
              options={{ headerTitle: 'Contact Support' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
