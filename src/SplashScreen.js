import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions, Image } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Bus } from 'lucide-react-native';

const { width, height } = Dimensions.get('window');

export default function SplashScreen({ onFinish }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const translateY = useRef(new Animated.Value(50)).current;
  const busTranslateX = useRef(new Animated.Value(-width)).current;
  const busRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Initial animations
    Animated.parallel([
      // Fade in and scale up the main content
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      // Slide up animation
      Animated.spring(translateY, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      // Bus animation
      Animated.sequence([
        Animated.timing(busTranslateX, {
          toValue: width * 0.1,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.spring(busTranslateX, {
          toValue: 0,
          friction: 4,
          useNativeDriver: true,
        })
      ])
    ]).start();

    // Bus gentle bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(busRotate, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true
        }),
        Animated.timing(busRotate, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true
        })
      ])
    ).start();

    // Exit animation
    setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1.1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(busTranslateX, {
          toValue: width,
          duration: 800,
          useNativeDriver: true,
        })
      ]).start(() => onFinish && onFinish());
    }, 3000);
  }, [fadeAnim, scaleAnim, translateY, busTranslateX, busRotate, onFinish]);

  const spin = busRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '2deg']
  });

  return (
    <LinearGradient
      colors={['#1e293b', '#0f172a', '#312e81']}
      style={styles.gradient}
      start={[0, 0]}
      end={[1, 1]}
    >
      {/* Animated background elements */}
      <View style={styles.backgroundElements}>
        <View style={[styles.circle, styles.circle1]} />
        <View style={[styles.circle, styles.circle2]} />
        <View style={[styles.circle, styles.circle3]} />
      </View>

      <Animated.View 
        style={[
          styles.center, 
          { 
            opacity: fadeAnim,
            transform: [
              { scale: scaleAnim },
              { translateY: translateY }
            ] 
          }
        ]}
      >
        {/* Moving Bus Icon */}
        <Animated.View
          style={[
            styles.busContainer,
            {
              transform: [
                { translateX: busTranslateX },
                { rotate: spin }
              ]
            }
          ]}
        >
          <Bus size={48} color="#60a5fa" style={styles.busIcon} />
        </Animated.View>

        {/* College Logo */}
        <Image
          source={require('../assets/canara-logo.png')}
          style={styles.collegeLogo}
          resizeMode="contain"
        />

        {/* App Title and Subtitle */}
        <View style={styles.titleContainer}>
          <Text style={styles.appName}>Can-Track</Text>
          <Text style={styles.subtitle}>Bus Tracking System</Text>
          <Text style={styles.collegeText}>Canara Engineering College</Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden'
  },
  backgroundElements: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden'
  },
  circle: {
    position: 'absolute',
    borderRadius: 1000,
    backgroundColor: 'rgba(96, 165, 250, 0.1)'
  },
  circle1: {
    width: width * 1.5,
    height: width * 1.5,
    top: -width * 0.5,
    left: -width * 0.25,
  },
  circle2: {
    width: width,
    height: width,
    bottom: -width * 0.3,
    right: -width * 0.3,
  },
  circle3: {
    width: width * 0.8,
    height: width * 0.8,
    top: height * 0.3,
    left: -width * 0.4,
  },
  center: {
    alignItems: 'center',
    width: '100%',
  },
  busContainer: {
    marginBottom: 20,
    padding: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  busIcon: {
    shadowColor: '#60a5fa',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.5,
    shadowRadius: 10,
  },
  collegeLogo: {
    width: width * 0.32,
    height: width * 0.32,
    marginBottom: 20,
    shadowColor: '#fff',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  titleContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: 20,
    borderRadius: 16,
    width: '85%',
    maxWidth: 300,
  },
  appName: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 1,
    textShadowColor: 'rgba(96, 165, 250, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    color: '#60a5fa',
    fontSize: 18,
    marginTop: 8,
    fontWeight: '600',
  },
  collegeText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 16,
    marginTop: 8,
    fontWeight: '500',
  },
});
