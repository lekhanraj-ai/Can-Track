import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Platform,
  Linking,
  Dimensions,
} from 'react-native';
import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { apiClient } from './services/api';
import { busDetails } from './config/busDetails';

const SUPPORT_NUMBER = '+917349341496';

// visual constants
const ROUTE_WIDTH = Platform.OS === 'web' ? 360 : 260;

// Dashboard adapted for React Native + Expo
// Integrates with the project's centralized apiClient and
// handles missing endpoints gracefully so the app doesn't crash.

const openDialer = async () => {
  const url = `tel:${SUPPORT_NUMBER}`;
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

export default function Dashboard({ navigation, user, onLogout }) {
  const [bus, setBus] = useState(null);
  const [track, setTrack] = useState(null);
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(true);
  const [location, setLocation] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [trackingInterval, setTrackingInterval] = useState(null);

  // Debug log
  useEffect(() => {
    console.log('Dashboard User Data:', user);
    console.log('Available Bus Details:', busDetails);
    console.log('Current Bus Number:', user?.busNumber);
    console.log('Bus Info:', user?.busNumber ? busDetails[user.busNumber] : 'No bus number');
  }, [user]);

  // Location tracking setup
  const startTracking = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required for tracking.');
        return;
      }

      // Start tracking interval
      const id = setInterval(async () => {
        const { coords } = await Location.getCurrentPositionAsync({});
        setLocation(coords);

        // Send location to backend
        try {
          await apiClient.post('/api/locations/new_location_add', {
            vehicleId: user.busNumber, // Using busNumber as vehicleId
            latitude: coords.latitude,
            longitude: coords.longitude,
            timestamp: new Date().toISOString(),
          });
          console.log('Location sent to backend');
        } catch (err) {
          console.error('Error sending location:', err);
        }
      }, 10000);

      setTrackingInterval(id);
      setIsTracking(true);
    } catch (error) {
      console.error('Error starting tracking:', error);
      Alert.alert('Error', 'Failed to start location tracking');
    }
  };

  const stopTracking = () => {
    if (trackingInterval) {
      clearInterval(trackingInterval);
      setTrackingInterval(null);
      setIsTracking(false);
      console.log('Location tracking stopped');
    }
  };

  // Cleanup tracking on unmount
  useEffect(() => {
    return () => {
      if (trackingInterval) {
        clearInterval(trackingInterval);
      }
    };
  }, [trackingInterval]);
  // Animation refs
  const enterAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const busPos = useRef(new Animated.Value(0)).current; // 0..1 position along the route bar

  useEffect(() => {
    let mounted = true;

    const fetchBus = async () => {
      try {
        // Try a health-check first
        await apiClient.get('/health');

        // Only fetch details for the user's allocated bus
        const res = await apiClient.get(`/bus-details/${user.busNumber}`).catch(() => null);
        if (mounted) setBus(res?.data || null);
      } catch (err) {
        // We intentionally swallow errors here and show friendly message
        console.warn('Dashboard: backend not fully available', err?.message || err);
        if (mounted) setBus(null);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchBus();
    // entrance animation
    Animated.timing(enterAnim, {
      toValue: 1,
      duration: 600,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();

    // pulsing animation for live indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0, duration: 900, useNativeDriver: true }),
      ])
    ).start();
    return () => (mounted = false);
  }, []);

  const handleTrackBus = async () => {
    try {
      if (!user?.busNumber) {
        throw new Error('No bus assigned');
      }

      if (isTracking) {
        stopTracking();
        setTrack(false);
      } else {
        await startTracking();
        setTrack(true);
      }

      const locationData = await locationAPI.getBusLocation(user.busNumber);
      
      if (!locationData) {
        throw new Error('Bus location not available');
      }

      setTrack({
        latitude: locationData.latitude,
        longitude: locationData.longitude,
        status: locationData.isActive ? 'On Route' : 'Not Active',
        speed: locationData.speed,
        lastUpdated: locationData.lastUpdated
      });

      // Animate bus position along route
      const pos = computeNormalizedPosition(locationData);
      Animated.timing(busPos, {
        toValue: pos,
        duration: 900,
        easing: Easing.inOut(Easing.quad),
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.error('Track bus error:', err);
      Alert.alert('Error', err.message || 'Failed to track bus');
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim()) {
      Alert.alert('Validation', 'Please write a message before sending.');
      return;
    }

    try {
      await apiClient.post('/contact', { message });
      setSent(true);
      setMessage('');
      setTimeout(() => setSent(false), 2000);
    } catch (err) {
      console.warn('Send message failed', err?.message || err);
      Alert.alert('Send failed', 'Could not send message. Try again later.');
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Welcome Header */}
      <Animated.View style={[styles.routeHeader, {
        transform: [{ translateY: enterAnim.interpolate({ inputRange: [0,1], outputRange: [-20,0] }) }],
        opacity: enterAnim,
      }]}>
        <View style={styles.welcomeContainer}>
          <Text style={styles.welcomeText}>Welcome to</Text>
          <Text style={styles.routeTitle}>
            {user?.busNumber ? `Bus ${user.busNumber.replace('BUS', '')}` : 'Your Bus'}
          </Text>
          <Text style={styles.busNumber}>{user?.busNumber || ''}</Text>
        </View>
      </Animated.View>

      <Animated.View style={{
        transform: [{ translateY: enterAnim.interpolate({ inputRange: [0,1], outputRange: [18,0] }) }],
        opacity: enterAnim,
        width: '100%',
        alignItems: 'center'
      }}>
        <Text style={styles.title}>🚍 Your Bus Tracking Dashboard</Text>
      </Animated.View>

      <Animated.View style={[styles.card, animatedCard(enterAnim, 0.1)]}>
        <Text style={styles.cardTitle}>Bus Information</Text>
        {user?.busNumber && busDetails[user.busNumber] ? (
          <View style={styles.detailsContainer}>
            <Text style={styles.field}>
              <Text style={styles.label}>Bus Number: </Text>
              {busDetails[user.busNumber].busNumber}
            </Text>
            <Text style={styles.field}>
              <Text style={styles.label}>Number Plate: </Text>
              {busDetails[user.busNumber].numberPlate}
            </Text>
            <Text style={styles.field}>
              <Text style={styles.label}>Status: </Text>
              {loading ? 'Loading...' : (bus?.status || 'On Route')}
            </Text>
            {!loading && bus?.speed && (
              <Text style={styles.field}>
                <Text style={styles.label}>Speed: </Text>
                {bus.speed} km/h
              </Text>
            )}
            <TouchableOpacity 
              style={styles.coordinatorButton} 
              onPress={() => {
                const num = busDetails[user.busNumber].coordinatorNumber;
                if (num) {
                  Linking.openURL(`tel:${num}`);
                }
              }}
            >
              <Text style={styles.coordinatorButtonText}>
                📞 Call Bus Coordinator
              </Text>
              <Text style={styles.coordinatorNumber}>
                {busDetails[user.busNumber].coordinatorNumber}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Text style={styles.muted}>Bus information not available</Text>
        )}
      </Animated.View>

      <Animated.View style={[styles.card, animatedCard(enterAnim, 0.2)]}>
        <Text style={styles.cardTitle}>Track My Bus</Text>

        {/* Route bar with animated bus */}
        <View style={styles.routeContainer}>
          <View style={styles.routeLine} />

          {/* start point */}
          <View style={[styles.routeDot, { left: 6 }]}>
            <Text style={styles.dotLabel}>S</Text>
          </View>

          {/* end point */}
          <View style={[styles.routeDot, { right: 6, left: undefined }]}>
            <Text style={styles.dotLabel}>E</Text>
          </View>

          {/* animated bus marker along the route */}
          <Animated.View
            style={[
              styles.busMarker,
              {
                transform: [{ translateX: busPos.interpolate({ inputRange: [0,1], outputRange: [6, ROUTE_WIDTH - 28] }) }],
              },
            ]}
          >
            <Text style={styles.busEmoji}>🚍</Text>
          </Animated.View>
        </View>

        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity 
            style={[styles.button, { marginRight: 8 }]} 
            onPress={() => navigation.navigate('Map', { 
              busNumber: user.busNumber,
              username: user.username 
            })}
          >
            <Text style={styles.buttonText}>Track Bus Location</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.button, styles.altButton]} 
            onPress={() => navigation.navigate('Map', { busNumber: user.busNumber })}
          >
            <Text style={styles.buttonText}>View on Map</Text>
          </TouchableOpacity>
        </View>

        <View style={{ marginTop: 8 }}>
          {track && location ? (
            <>
              <View style={styles.mapContainer}>
                <MapView
                  style={styles.map}
                  initialRegion={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                  region={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                    latitudeDelta: 0.005,
                    longitudeDelta: 0.005,
                  }}
                >
                  <Marker
                    coordinate={{
                      latitude: location.latitude,
                      longitude: location.longitude,
                    }}
                    title={`Bus ${user.busNumber}`}
                    description="Current Location"
                  >
                    <View style={styles.busMarker}>
                      <Text style={styles.busEmoji}>🚍</Text>
                    </View>
                  </Marker>
                </MapView>
              </View>
              <Text style={styles.field}>
                <Text style={styles.label}>Status: </Text>Live Tracking{"\n"}
                <Text style={styles.label}>Lat: </Text>{location.latitude.toFixed(6)}{"\n"}
                <Text style={styles.label}>Long: </Text>{location.longitude.toFixed(6)}
              </Text>
            </>
          ) : (
            <Text style={styles.muted}>
              {isTracking ? 'Getting location...' : 'Press "Track" to start live tracking'}
            </Text>
          )}
        </View>

        {/* live pulsing indicator */}
        <View style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ width: 24, height: 24, marginRight: 8 }}>
            <Animated.View style={[styles.pulseBase, {
              transform: [{ scale: pulseAnim.interpolate({ inputRange: [0,1], outputRange: [1, 1.6] }) }],
              opacity: pulseAnim.interpolate({ inputRange: [0,1], outputRange: [0.6, 0.15] })
            }]} />
            <View style={styles.pulseDot} />
          </View>
          <Text style={{ color: '#2b6cb0' }}>Live tracking</Text>
        </View>

      </Animated.View>

      <Animated.View style={[styles.card, animatedCard(enterAnim, 0.3)]}>
        <Text style={styles.cardTitle}>Contact Us</Text>
        <TextInput
          placeholder="Type your message..."
          value={message}
          onChangeText={setMessage}
          style={styles.textarea}
          multiline
        />
        <View style={{ flexDirection: 'row' }}>
          <TouchableOpacity style={[styles.button, { marginRight: 8 }]} onPress={handleSendMessage}>
            <Text style={styles.buttonText}>Send</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.altButton]} onPress={openDialer}>
            <Text style={styles.buttonText}>Call Support</Text>
          </TouchableOpacity>
        </View>
        {sent && <Text style={{ color: 'green', marginTop: 8 }}>Message sent!</Text>}
      </Animated.View>

      <Animated.View style={[styles.card, animatedCard(enterAnim, 0)]}>
        <Text style={styles.cardTitle}>User</Text>
        {user ? (
          <>
            <Text style={styles.field}><Text style={styles.label}>Name: </Text>{user.name}</Text>
            <Text style={styles.field}><Text style={styles.label}>USN: </Text>{user.usn}</Text>
            <TouchableOpacity style={styles.logoutButton} onPress={onLogout}>
              <Text style={styles.logoutText}>Logout</Text>
            </TouchableOpacity>
          </>
        ) : (
          <Text style={styles.muted}>Not signed in</Text>
        )}
  </Animated.View>
    </ScrollView>
  );
}

// computeNormalizedPosition: create a deterministic 0..1 position using available coords
function computeNormalizedPosition(track) {
  try {
    if (!track) return 0.2;
    const lat = Number(track.latitude) || 0;
    const lon = Number(track.longitude) || 0;
    // simple hash: fractional parts averaged
    const a = Math.abs(lat) % 1;
    const b = Math.abs(lon) % 1;
    const pos = (a + b) / 2;
    return Math.max(0, Math.min(1, pos));
  } catch (e) {
    return Math.random();
  }
}

function animatedCard(enterAnim, delay) {
  return {
    opacity: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1], }),
    transform: [{ translateY: enterAnim.interpolate({ inputRange: [0, 1], outputRange: [20 + delay * 30, 0] }) }],
  };
}

const styles = StyleSheet.create({
  mapContainer: {
    height: 300,
    marginVertical: 10,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  container: {
    alignItems: 'center',
    padding: 20,
    paddingBottom: 60,
    backgroundColor: '#E6F7FF',
  },
  detailsContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  coordinatorButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  coordinatorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  coordinatorNumber: {
    color: '#ecfdf5',
    fontSize: 14,
  },
  routeHeader: {
    backgroundColor: '#1E40AF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: '100%',
    marginBottom: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  welcomeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  welcomeText: {
    fontSize: 16,
    color: '#93C5FD',
    fontWeight: '500',
    marginBottom: 4,
  },
  routeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  busNumber: {
    fontSize: 16,
    color: '#BFDBFE',
    fontWeight: '600',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#003366',
    marginBottom: 12,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 12,
    width: '95%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  field: {
    fontSize: 15,
    marginBottom: 8,
    color: '#1f2937',
  },
  label: {
    fontWeight: '700',
    color: '#374151',
  },
  detailsContainer: {
    backgroundColor: '#f8fafc',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  coordinatorButton: {
    backgroundColor: '#10b981',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  coordinatorButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  coordinatorNumber: {
    color: '#ecfdf5',
    fontSize: 14,
  },
  statusSection: {
    backgroundColor: '#f0f9ff',
    padding: 12,
    borderRadius: 8,
  },
  muted: {
    color: '#666',
    fontStyle: 'italic',
  },
  button: {
    backgroundColor: '#1E90FF',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  buttonText: {
    color: 'white',
    fontWeight: '700',
  },
  altButton: {
    backgroundColor: '#0b63c4',
  },
  logoutButton: {
    marginTop: 10,
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  logoutText: {
    color: 'white',
    fontWeight: '700',
  },
  textarea: {
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    height: 80,
    textAlignVertical: 'top',
  },
  routeContainer: {
    width: ROUTE_WIDTH,
    height: 48,
    justifyContent: 'center',
    marginVertical: 8,
  },
  routeLine: {
    position: 'absolute',
    left: 12,
    right: 12,
    height: 6,
    backgroundColor: '#e6f2ff',
    borderRadius: 6,
  },
  routeDot: {
    position: 'absolute',
    top: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#1E90FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotLabel: {
    color: '#1E90FF',
    fontWeight: '700',
  },
  busMarker: {
    position: 'absolute',
    top: 6,
    left: 6,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  busEmoji: {
    fontSize: 20,
  },
  pulseBase: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#60a5fa',
  },
  pulseDot: {
    position: 'absolute',
    left: 6,
    top: 6,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#1E90FF',
    elevation: 2,
  },
});