import React, { useState, useEffect } from "react";
import { 
  View, 
  StyleSheet, 
  Text,
  ActivityIndicator,
  SafeAreaView,
  TouchableOpacity 
} from "react-native";
import * as Location from "expo-location";
import MapView, { Marker, Circle } from 'react-native-maps';

const TrackerScreen = ({ navigation }) => {
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [locationSubscription, setLocationSubscription] = useState(null);

  const startTracking = async () => {
    try {
      // Request permissions
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      // Start watching position
      const subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          distanceInterval: 10, // Update every 10 meters
          timeInterval: 5000    // Or every 5 seconds
        },
        (newLocation) => {
          setLocation(newLocation.coords);
          console.log('Location updated:', newLocation.coords);
        }
      );

      setLocationSubscription(subscription);
      setIsTracking(true);
    } catch (err) {
      setErrorMsg('Error starting location tracking');
      console.error(err);
    }
  };

  const stopTracking = () => {
    if (locationSubscription) {
      locationSubscription.remove();
      setLocationSubscription(null);
    }
    setIsTracking(false);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [locationSubscription]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      // no intervalId used in this component; ensure any active subscriptions are removed
      // interval timers are not created here. Location subscription cleanup is handled above.
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Live Location Tracking</Text>
        <TouchableOpacity
          style={[
            styles.trackButton,
            isTracking ? styles.stopButton : styles.startButton
          ]}
          onPress={isTracking ? stopTracking : startTracking}
        >
          <Text style={styles.buttonText}>
            {isTracking ? 'Stop Tracking' : 'Start Tracking'}
          </Text>
        </TouchableOpacity>
      </View>
      
      <View style={styles.content}>
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: location?.latitude || 20.5937,
              longitude: location?.longitude || 78.9629,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            }}
            region={location ? {
              latitude: location.latitude,
              longitude: location.longitude,
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
            } : undefined}
          >
            {location && (
              <>
                <Marker
                  coordinate={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  title="Your Location"
                  description={isTracking ? "Live tracking" : "Last known position"}
                >
                  <View style={styles.markerContainer}>
                    <Text style={styles.markerEmoji}>�</Text>
                  </View>
                </Marker>
                <Circle
                  center={{
                    latitude: location.latitude,
                    longitude: location.longitude,
                  }}
                  radius={50}
                  fillColor="rgba(37, 99, 235, 0.2)"
                  strokeColor="rgba(37, 99, 235, 0.5)"
                />
              </>
            )}
          </MapView>
        </View>

        <View style={styles.infoContainer}>
          {errorMsg ? (
            <Text style={styles.errorText}>{errorMsg}</Text>
          ) : location ? (
            <>
              <Text style={styles.infoTitle}>Current Location</Text>
              <Text style={styles.locationText}>
                Latitude: {location.latitude.toFixed(6)}{"\n"}
                Longitude: {location.longitude.toFixed(6)}
                {location.speed && `\nSpeed: ${(location.speed * 3.6).toFixed(1)} km/h`}
                {location.altitude && `\nAltitude: ${location.altitude.toFixed(0)}m`}
              </Text>
              {isTracking && (
                <Text style={styles.updateText}>
                  Updates every 5 seconds or 10 meters
                </Text>
              )}
            </>
          ) : (
            <Text style={styles.locationText}>
              {isTracking ? 'Getting location...' : 'Press Start Tracking to begin'}
            </Text>
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f3f4f6',
  },
  header: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  trackButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    elevation: 2,
  },
  startButton: {
    backgroundColor: '#2563eb',
  },
  stopButton: {
    backgroundColor: '#dc2626',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  mapContainer: {
    height: '70%',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    backgroundColor: '#fff',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  markerContainer: {
    alignItems: 'center',
  },
  markerEmoji: {
    fontSize: 36,
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4b5563',
  },
  errorText: {
    color: '#dc2626',
    fontSize: 15,
  },
  updateText: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 8,
    fontStyle: 'italic',
  },
});

export default TrackerScreen;