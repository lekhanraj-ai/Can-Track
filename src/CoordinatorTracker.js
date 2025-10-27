import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  Alert,
  Platform,
  TouchableOpacity,
} from 'react-native';
import * as Location from 'expo-location';
import { locationAPI } from './services/api';

export default function CoordinatorTracker({ user, busNumber }) {
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState(null);
  const [locationSubscription, setLocationSubscription] = useState(null);

  useEffect(() => {
    // Cleanup subscription on unmount
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  const requestLocationPermission = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Please grant location permission to share bus location.'
        );
        return false;
      }
      return true;
    } catch (err) {
      console.error('Error requesting location permission:', err);
      return false;
    }
  };

  const startTracking = async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return;

      // Configure location tracking
      await Location.enableNetworkProviderAsync();
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // minimum distance (in meters) between updates
          timeInterval: 5000,   // minimum time (in ms) between updates
        },
        async (newLocation) => {
          setLocation(newLocation);
          try {
            await locationAPI.updateBusLocation({
              busNumber,
              latitude: newLocation.coords.latitude,
              longitude: newLocation.coords.longitude,
              speed: newLocation.coords.speed || 0,
              coordinatorPhone: user.phone
            });
          } catch (err) {
            console.error('Failed to update location:', err);
          }
        }
      );

      setLocationSubscription(subscription);
      setIsTracking(true);

      // Update bus active status
      await locationAPI.updateBusStatus({
        busNumber,
        isActive: true,
        coordinatorPhone: user.phone
      });
    } catch (err) {
      console.error('Error starting location tracking:', err);
      Alert.alert('Error', 'Failed to start location tracking. Please try again.');
    }
  };

  const stopTracking = async () => {
    try {
      if (locationSubscription) {
        locationSubscription.remove();
      }
      setLocationSubscription(null);
      setIsTracking(false);

      // Update bus inactive status
      await locationAPI.updateBusStatus({
        busNumber,
        isActive: false,
        coordinatorPhone: user.phone
      });
    } catch (err) {
      console.error('Error stopping location tracking:', err);
      Alert.alert('Error', 'Failed to stop location tracking. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Bus Location Sharing</Text>
        <Switch
          value={isTracking}
          onValueChange={(value) => {
            if (value) {
              startTracking();
            } else {
              stopTracking();
            }
          }}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={isTracking ? '#1E90FF' : '#f4f3f4'}
        />
      </View>

      {isTracking && location && (
        <View style={styles.locationInfo}>
          <Text style={styles.label}>Current Location:</Text>
          <Text>Latitude: {location.coords.latitude.toFixed(6)}</Text>
          <Text>Longitude: {location.coords.longitude.toFixed(6)}</Text>
          <Text>Speed: {((location.coords.speed || 0) * 3.6).toFixed(1)} km/h</Text>
          <Text style={styles.status}>Status: Active</Text>
        </View>
      )}

      <Text style={styles.note}>
        Note: Keep the app open while sharing location. Battery usage may increase while tracking is active.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    margin: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1E90FF',
  },
  locationInfo: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#f5f5f5',
    borderRadius: 6,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 8,
  },
  status: {
    marginTop: 8,
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  note: {
    marginTop: 16,
    color: '#666',
    fontSize: 12,
    fontStyle: 'italic',
  },
});