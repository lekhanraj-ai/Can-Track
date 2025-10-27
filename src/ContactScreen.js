import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking, Alert, TextInput } from 'react-native';

const openDialer = async (number) => {
  if (!number?.trim()) {
    Alert.alert('Enter Number', 'Please enter a phone number to call.');
    return;
  }

  const url = `tel:${number.replace(/[^0-9+]/g, '')}`;
  try {
    const supported = await Linking.canOpenURL(url);
    if (!supported) {
      Alert.alert('Cannot make calls', 'Phone calls are not supported on this device.');
      return;
    }
    await Linking.openURL(url);
  } catch (e) {
    console.warn('Dialer open failed', e?.message || e);
    Alert.alert('Error', 'Unable to open the phone dialer.');
  }
};

export default function ContactScreen({ user, onBack }) {
  const [phoneNumber, setPhoneNumber] = useState('');

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Contact Support</Text>
      <View style={styles.card}>
        <Text style={styles.heading}>Call Contact</Text>
        <Text style={styles.info}>Enter the phone number you'd like to call:</Text>
        
        <TextInput 
          style={styles.input}
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
          returnKeyType="done"
        />

        <TouchableOpacity 
          style={[styles.button, styles.callButton]} 
          onPress={() => openDialer(phoneNumber)}
        >
          <Text style={styles.buttonText}>Call Number</Text>
        </TouchableOpacity>
      </View>

      {user && (
        <View style={styles.card}>
          <Text style={styles.heading}>Logged in as</Text>
          <Text style={styles.info}>{user.name} ({user.usn})</Text>
        </View>
      )}

      <TouchableOpacity style={styles.button} onPress={onBack}>
        <Text style={styles.buttonText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    alignItems: 'center', 
    padding: 20, 
    backgroundColor: '#E6F7FF', 
    minHeight: '100%' 
  },
  title: { 
    fontSize: 22, 
    fontWeight: '700', 
    marginBottom: 12, 
    color: '#003366' 
  },
  card: { 
    width: '95%', 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12 
  },
  heading: { 
    fontSize: 16, 
    fontWeight: '700', 
    marginBottom: 8 
  },
  info: { 
    fontSize: 14, 
    color: '#333', 
    marginBottom: 12 
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    width: '100%',
    marginBottom: 12
  },
  button: { 
    backgroundColor: '#1E90FF', 
    padding: 12, 
    borderRadius: 8,
    marginTop: 4,
    width: '100%',
    alignItems: 'center'
  },
  callButton: {
    backgroundColor: '#22c55e',
  },
  buttonText: { 
    color: 'white', 
    fontWeight: '700',
    fontSize: 16
  },
});
