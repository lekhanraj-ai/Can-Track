import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';

export default function TrackScreen({ user, onBack }) {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Track My Bus</Text>
      <View style={styles.card}>
        <Text style={styles.heading}>Live Tracking</Text>
        <Text style={styles.info}>This screen would show a live map or detailed tracking timeline.
        For now it displays a placeholder with user info.</Text>
        {user && (
          <Text style={styles.info}>Tracking for: {user.name} ({user.usn})</Text>
        )}
      </View>

      <TouchableOpacity style={styles.button} onPress={onBack}>
        <Text style={styles.buttonText}>Back to Dashboard</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 20, backgroundColor: '#E6F7FF', minHeight: '100%' },
  title: { fontSize: 22, fontWeight: '700', marginBottom: 12, color: '#003366' },
  card: { width: '95%', backgroundColor: '#fff', padding: 16, borderRadius: 12, marginBottom: 12 },
  heading: { fontSize: 16, fontWeight: '700', marginBottom: 8 },
  info: { fontSize: 14, color: '#333' },
  button: { backgroundColor: '#1E90FF', padding: 12, borderRadius: 8, marginTop: 12 },
  buttonText: { color: 'white', fontWeight: '700' },
});
