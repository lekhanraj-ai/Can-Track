import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Platform,
  Alert,
  Image,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { locationAPI } from './services/api';
import * as Location from 'expo-location';

const INITIAL_REGION = {
  latitude: 12.9716,  // Default to Bangalore
  longitude: 77.5946,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

export default function MapScreen({ route, navigation }) {
  const { busNumber } = route.params;
  const [busLocation, setBusLocation] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const mapRef = useRef(null);
  const locationUpdateInterval = useRef(null);
  const userLocationSubscription = useRef(null);

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

    // Request location permissions and start tracking
    const setupLocationTracking = async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Location permission denied');
          return;
        }

        // Get initial location
        const initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High
        });
        setUserLocation(initialLocation.coords);

        // Start watching location
        userLocationSubscription.current = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 5000,
            distanceInterval: 10,
          },
          (location) => {
            setUserLocation(location.coords);
          }
        );
      } catch (err) {
        setError('Error getting location: ' + err.message);
      }
    };

    setupLocationTracking();
    fetchBusLocation();

    // Set up interval for periodic bus location updates
    locationUpdateInterval.current = setInterval(fetchBusLocation, 10000);

    return () => {
      if (locationUpdateInterval.current) {
        clearInterval(locationUpdateInterval.current);
      }
      if (userLocationSubscription.current) {
        userLocationSubscription.current.remove();
      }
    };
  }, [busNumber]);

  const fetchBusLocation = async () => {
    try {
      let data;

      // Special case: when tracking bus number 5 or BUS005, treat it as a friend's live location
      // and fetch from the friend-location endpoint. The server must support
      // GET /friend/:id/location for this to work. We pass '5' as the friendId.
      if (busNumber === '5' || busNumber === 'BUS005') {
        console.log('MapScreen: Using friend endpoint for bus', busNumber);
        data = await locationAPI.getFriendLocation('5');
      } else {
        console.log('MapScreen: Using bus endpoint for bus', busNumber);
        data = await locationAPI.getBusLocation(busNumber);
      }

      setBusLocation(data);
      setError(null);
      console.log('MapScreen: fetched busLocation ->', data);

      // Animate to new location if we don't have user location yet
      if (mapRef.current && data && !userLocation) {
        mapRef.current.animateToRegion({
          latitude: data.latitude,
          longitude: data.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        }, 1000);
      }
    } catch (err) {
      console.error('MapScreen: fetchBusLocation error', err);
      setError('Error fetching location: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  };

  // Calculates distance between two coords (meters) using Haversine formula
  const getDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const toRad = (v) => (v * Math.PI) / 180;
    const R = 6371000; // Earth radius in meters
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // Compute distance and ETA (minutes) between user and bus/friend
  const computeEta = () => {
    if (!userLocation || !busLocation) return { distanceMeters: null, etaText: null };

    const d = getDistanceMeters(userLocation.latitude, userLocation.longitude, busLocation.latitude, busLocation.longitude);

    // If bus provides speed in km/h, use it. Otherwise assume default avg speed (12 km/h -> 5 min per km)
    const defaultSpeedKmh = 12; // conservative city estimate matching example (1 km -> ~5 min)
    const speedKmh = busLocation.speed && typeof busLocation.speed === 'number' ? busLocation.speed : defaultSpeedKmh;

    // avoid zero speed
    const speedToUse = speedKmh > 0.1 ? speedKmh : defaultSpeedKmh;

    const distanceKm = d / 1000;
    const etaHours = distanceKm / speedToUse; // in hours
    const etaMinutes = Math.round(etaHours * 60);

    let etaText = null;
    if (d <= 30) {
      etaText = 'Arrived';
    } else if (etaMinutes <= 1) {
      etaText = 'Less than 1 min';
    } else {
      etaText = `${etaMinutes} mins away`;
    }

    return { distanceMeters: Math.round(d), etaText };
  };

  const { distanceMeters, etaText } = computeEta();

  // Only show loading screen if we don't have any location data at all
  if (loading && !busLocation && !userLocation) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#1E90FF" />
        <Text style={styles.loadingText}>Loading locations...</Text>
      </View>
    );
  }

  const initialRegion = userLocation ? {
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  } : busLocation ? {
    latitude: busLocation.latitude,
    longitude: busLocation.longitude,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  } : INITIAL_REGION;

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorBanner}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchBusLocation}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
      <MapView
        ref={mapRef}
        style={styles.map}
        provider={Platform.select({
          android: PROVIDER_GOOGLE,
          ios: PROVIDER_GOOGLE,
          default: undefined
        })}
        initialRegion={initialRegion}
        showsUserLocation={false} // we render a custom user marker (human) below
        showsMyLocationButton={true}
      >
        {userLocation && (
          <Marker
            coordinate={{
              latitude: userLocation.latitude,
              longitude: userLocation.longitude,
            }}
            anchor={{ x: 0.5, y: 1 }}
            title="You"
          >
            <View style={styles.userMarker}>
              <Text style={styles.markerEmoji}>📍</Text>
            </View>
          </Marker>
        )}
        
        {busLocation && (
          <Marker
            coordinate={{
              latitude: busLocation.latitude,
              longitude: busLocation.longitude,
            }}
            anchor={{ x: 0.5, y: 1 }}
            title={Number(busNumber) === 5 ? "Friend's Location" : `Bus ${busNumber}`}
            description={Number(busNumber) === 5 ? (busLocation.note || 'Live location from friend') : `Speed: ${busLocation.speed ? (busLocation.speed).toFixed(1) + ' km/h' : 'N/A'}`}
          >
            <View style={styles.busToyMarker}>
              <Text style={styles.busEmoji}>🚍</Text>
            </View>
          </Marker>
        )}
      </MapView>

      {userLocation && (
        <View style={styles.infoPanel}>
          {/* Arrival / ETA summary */}
          <Text style={styles.etaText}>{etaText || (busLocation ? 'Estimating arrival...' : 'Waiting for bus location...')}</Text>

          {/* Show distance if available */}
          {typeof distanceMeters === 'number' && (
            <Text style={styles.infoPanelText}>
              {distanceMeters >= 1000
                ? `${(distanceMeters / 1000).toFixed(2)} km away`
                : `${distanceMeters} m away`}
            </Text>
          )}

          {/* Show bus speed/last-updated only if busLocation exists */}
          {busLocation ? (
            <>
              <Text style={styles.infoPanelText}>
                Speed: {busLocation.speed ? `${busLocation.speed.toFixed(1)} km/h` : 'N/A'}
              </Text>
              <Text style={styles.infoPanelText}>
                Last Updated: {busLocation.lastUpdated ? new Date(busLocation.lastUpdated).toLocaleTimeString() : 'N/A'}
              </Text>
            </>
          ) : (
            <Text style={styles.infoPanelText}>
              Make sure the server is running and friend location is posted to /api/friend/5/location
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
    elevation: 5,
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
    fontSize: 28,
  },
  busToyMarker: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 6,
    borderWidth: 2,
    borderColor: '#ffb703',
    elevation: 6,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 4,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  userMarkerImage: {
    width: 40,
    height: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    ...Platform.select({
      android: {
        elevation: 6,
      }
    }),
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
  etaText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E90FF',
    marginTop: 6,
  },
  userMarker: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerEmoji: {
    fontSize: 40,
  },
  errorBanner: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: 'white',
    flex: 1,
    marginRight: 10,
  },
  retryButton: {
    backgroundColor: 'white',
    padding: 5,
    borderRadius: 5,
  },
  retryButtonText: {
    color: 'red',
    fontWeight: 'bold',
  },
});