import React from 'react';
import { View, Text } from 'react-native';

// UserDetailsForm removed - fields moved into SigninPage. This placeholder remains
// only in case any import is left in the codebase. The app should not navigate here.
const UserDetailsForm = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
    <Text>UserDetailsForm removed. Use Sign Up page to enter your details.</Text>
  </View>
);

export default UserDetailsForm;