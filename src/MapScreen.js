import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Platform,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { locationAPI } from './services/api';

const INITIAL_REGION = {
  latitude: 12.9716,  // Default to Bangalore
  longitude: 77.5946,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function MapScreen({ route, navigation }) {
  const { busNumber } = route.params;
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const locationUpdateInterval = useRef(null);

  useEffect(() => {
    // Set up navigation header
    navigation.setOptions({
      headerTitle: `Bus ${busNumber} Location`,
      headerRight: () => (
        <TouchableOpacity 
          style={styles.refreshButton}
          onPress={fetchBusLocation}
        >
          <Text style={styles.refreshButtonText}>↻</Text>
        </TouchableOpacity>
      ),
    });

    // Initial fetch
    fetchBusLocation();

    // Set up interval for periodic updates
    locationUpdateInterval.current = setInterval(fetchBusLocation, 10000);

    return () => {
      if (locationUpdateInterval.current) {
        clearInterval(locationUpdateInterval.current);
      }
    };
  }, [busNumber]);

  const fetchBusLocation = async () => {
    try {
      const data = await locationAPI.getBusLocation(busNumber);
      setLocation(data);
      setError(null);

      // Animate to new location
      if (mapRef.current && data) {
        mapRef.current.animateToRegion({
          latitude: data.latitude,
          longitude: data.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !location) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1E90FF" />
        <Text style={styles.loadingText}>Loading bus location...</Text>
      </View>
    );
  }

  if (error && !location) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={fetchBusLocation}
        >
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.select({
          android: PROVIDER_GOOGLE,
          ios: PROVIDER_GOOGLE,
          default: undefined
        })}
        initialRegion={location ? {
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        } : INITIAL_REGION}
      >
        {location && (
          <Marker
            coordinate={{
              latitude: location.latitude,
              longitude: location.longitude,
            }}
            title={`Bus ${busNumber}`}
            description={`Speed: ${location.speed ? (location.speed).toFixed(1) + ' km/h' : 'N/A'}`}
          >
            <View style={styles.busMarker}>
              <Text style={styles.busEmoji}>🚍</Text>
            </View>
          </Marker>
        )}
      </MapView>

      {location && (
        <View style={styles.infoPanel}>
          <Text style={styles.infoPanelText}>
            Speed: {location.speed ? `${location.speed.toFixed(1)} km/h` : 'N/A'}
          </Text>
          <Text style={styles.infoPanelText}>
            Last Updated: {new Date(location.lastUpdated).toLocaleTimeString()}
          </Text>
          {location.status && (
            <Text style={styles.infoPanelText}>
              Status: {location.status}
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#1E90FF',
    padding: 12,
    borderRadius: 6,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  refreshButton: {
    padding: 8,
    marginRight: 8,
  },
  refreshButtonText: {
    fontSize: 24,
    color: '#1E90FF',
  },
  busMarker: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    borderWidth: 2,
    borderColor: '#1E90FF',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  busEmoji: {
    fontSize: 24,
  },
  infoPanel: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    padding: 15,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 5,
      },
    }),
  },
  infoPanelText: {
    fontSize: 16,
    marginBottom: 5,
    color: '#333',
  },
});