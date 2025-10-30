import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Image,
  Modal,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Lock, Eye, EyeOff, AlertCircle, Mail, Bus } from 'lucide-react-native';
import { authAPI } from './services/api';
import { getAllStops, findBusDetailsByStop } from './config/routes';

const YEARS = [1, 2, 3, 4];
const BRANCHES = [
  'Artificial Intelligence & Machine Learning',
  'Computer Science and Business Systems',
  'Computer Science and Design',
  'Computer Science and Engineering',
  'Electronics and Communication Engineering',
  'Information Science and Engineering',
  'Mechanical Engineering',
];

// Get all stops in alphabetical order
const PICKUP_POINTS = getAllStops();

const SigninPage = ({ onNavigateToLogin, navigation }) => {
  const [name, setName] = useState('');
  const [usn, setUsn] = useState('');
  const [branch, setBranch] = useState('');
  const [pickupPoint, setPickupPoint] = useState('');
  const [year, setYear] = useState(null);
  const [routeDetails, setRouteDetails] = useState(null);

  // Update route details when pickup point changes
  useEffect(() => {
    if (pickupPoint) {
      const details = findBusDetailsByStop(pickupPoint);
      console.log('Found route details:', details);
      setRouteDetails(details);
    }
  }, [pickupPoint]);
  const [pickerVisible, setPickerVisible] = useState(false);
  const [pickerItems, setPickerItems] = useState([]);
  const [pickerOnSelect, setPickerOnSelect] = useState(() => {});
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [createdUser, setCreatedUser] = useState(null);

  const validateInputs = () => {
    // Clear any previous error
    setError('');
    console.log('Starting input validation...');

    // Check all required fields
    const requiredFields = {
      'Name': name,
      'USN': usn,
      'Year': year,
      'Branch': branch,
      'Pickup Point': pickupPoint,
      'Phone Number': phone,
      'Password': password,
      'Confirm Password': confirmPassword
    };

    const missingFields = Object.entries(requiredFields)
      .filter(([_, value]) => !value)
      .map(([field]) => field);

    if (missingFields.length > 0) {
      setError(`Please fill in the following fields: ${missingFields.join(', ')}`);
      return false;
    }

    // Validate USN format (assuming format like "4SF20CS001")
    const usnPattern = /^\d[A-Z]{2}\d{2}[A-Z]{2}\d{3}$/;
    if (!usnPattern.test(usn.toUpperCase())) {
      setError('Please enter a valid USN (e.g., 4CB2XCSXXX)');
      return false;
    }

    // Validate year
    if (!year || typeof year !== 'number' || year < 1 || year > 4) {
      setError('Please select a valid year (1-4)');
      return false;
    }

    // Validate phone number (10 digits)
    const phonePattern = /^\d{10}$/;
    if (!phonePattern.test(phone)) {
      setError('Please enter a valid 10-digit phone number');
      return false;
    }

    // Validate password
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return false;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }

    // Validate route details
    if (!routeDetails) {
      console.log('❌ No route details found');
      setError('Could not determine bus route for selected pickup point.');
      return false;
    }

    if (!routeDetails.routeName || !routeDetails.busNumber) {
      console.log('❌ Incomplete route details:', routeDetails);
      setError('Invalid route information. Please select a valid pickup point.');
      return false;
    }

    console.log('✅ All validations passed');
    return true;
  };

  const handleSignin = async () => {
    setError('');
    
    if (!validateInputs()) {
      return;
    }

    setLoading(true);
    try {
      // Re-fetch route details to ensure they're current
      const currentRouteDetails = findBusDetailsByStop(pickupPoint);
      if (!currentRouteDetails || !currentRouteDetails.routeName || !currentRouteDetails.busNumber) {
        console.error('Missing route details:', { pickupPoint, currentRouteDetails });
        throw new Error('Could not determine bus route details for the selected pickup point');
      }

      console.log('Route details before signup:', currentRouteDetails);

      // Format data exactly as the Mongoose model expects it
      const signupData = {
        name: name.trim(),
        usn: usn.toUpperCase().trim(),
        year: parseInt(year, 10),  // Ensure it's a number
        branch: branch.trim(),
        pickupPoint: pickupPoint.trim(),
        phone: phone.replace(/\D/g, '').trim(), // Remove any non-digits
        password: password,
        routeName: currentRouteDetails.routeName,  // Use direct value without trim()
        busNumber: currentRouteDetails.busNumber,  // Use direct value without trim()
        role: 'student'
      };

      // Validate all required fields are present and properly formatted
      const missingFields = [];
      Object.entries(signupData).forEach(([key, value]) => {
        if (key !== 'role' && (!value || String(value).trim() === '')) {
          missingFields.push(key);
        }
      });

      if (missingFields.length > 0) {
        throw new Error(`Missing or invalid fields: ${missingFields.join(', ')}`);
      }

      // Validate specific field formats
      if (!Number.isInteger(signupData.year) || signupData.year < 1 || signupData.year > 4) {
        throw new Error('Year must be a number between 1 and 4');
      }

      if (signupData.phone.length !== 10) {
        throw new Error('Phone number must be exactly 10 digits');
      }

      if (!signupData.routeName || !signupData.busNumber) {
        throw new Error('Route information is missing. Please select a valid pickup point');
      }

      // Final validation of route information
      console.log('Validating route information...', {
        routeName: signupData.routeName,
        busNumber: signupData.busNumber
      });
      
      if (!signupData.routeName || !signupData.busNumber) {
        console.error('❌ Missing route information:', {
          routeName: signupData.routeName,
          busNumber: signupData.busNumber
        });
        throw new Error('Route information is missing. Please select a valid pickup point.');
      }

      console.log('✅ Submitting signup data:', { 
        ...signupData, 
        password: '[REDACTED]',
        routeInfo: {
          routeName: signupData.routeName,
          busNumber: signupData.busNumber
        }
      });
      
      const res = await authAPI.signup(signupData);
      
      if (res.user) {
        // show confirmation modal with returned user details
        setCreatedUser({ ...res.user, routeDetails });
        setShowModal(true);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (err) {
      console.error('❌ Signup error:', err);
      
      // Handle client-side validation errors
      if (!err.response) {
        console.error('Client-side error:', err.message);
        setError(err.message || 'Validation error occurred');
        return;
      }
      
      // Handle server response errors
      const serverData = err.response?.data;

      // If server sent an 'error' string, show it directly
      if (serverData?.error) {
        console.error('Server validation error:', serverData.error);
        setError(serverData.error);
        return;
      }

      // Handle structured server error payloads
      if (serverData) {
        if (serverData.code === 11000 || serverData.error?.includes?.('already registered')) {
          setError('This USN is already registered. Please use a different USN or contact support.');
        } else if (serverData.error?.includes?.('validation failed')) {
          setError('Please check all fields and try again.');
          console.error('Validation errors:', serverData.errors || serverData.details || serverData.validationErrors);
        } else if (serverData.missingFields) {
          const fields = serverData.missingFields.join(', ');
          setError(`Missing required fields: ${fields}`);
        } else if (serverData.details && Array.isArray(serverData.details)) {
          // Server returned structured details array
          setError(serverData.details.map(d => `${d.field}: ${d.message}`).join('; '));
        } else {
          setError(serverData.error || 'Server validation failed');
        }
      } else {
        setError('An unexpected error occurred. Please try again later.');
        console.error('Detailed error:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient colors={['#c7d2fe', '#e9d5ff', '#fbcfe8']} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.card}>
          {/* 🏫 Canara College Logo */}
          <Image
            source={require('../assets/canara-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Create Account 📝</Text>
          <Text style={styles.subtitle}>
            Join <Text style={{ fontWeight: 'bold' }}>Can Track</Text> today
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <AlertCircle color="#ef4444" size={18} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Name */}
          <View style={styles.inputGroup}>
            <User style={styles.icon} color="#9ca3af" size={18} />
            <TextInput
              placeholder="Full name"
              placeholderTextColor="#9ca3af"
              value={name}
              onChangeText={setName}
              style={styles.input}
            />
          </View>

          {/* USN */}
          <View style={styles.inputGroup}>
            <User style={styles.icon} color="#9ca3af" size={18} />
            <TextInput
              placeholder="USN"
              placeholderTextColor="#9ca3af"
              value={usn}
              onChangeText={setUsn}
              autoCapitalize="characters"
              style={styles.input}
            />
          </View>

          {/* Year, Branch, Pickup Point (pickers) */}
          <View style={styles.rowInline}>
            <TouchableOpacity
              style={[styles.inputGroup, styles.halfWidth]}
              onPress={() => { setPickerItems(YEARS.map(y => String(y))); setPickerOnSelect(() => (val) => setYear(Number(val))); setPickerVisible(true); }}
            >
              <User style={styles.icon} color="#9ca3af" size={18} />
              <Text style={[styles.input, !year && styles.placeholder]}>{year ? `Year ${year}` : 'Year'}</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.inputGroup, styles.halfWidth]}
              onPress={() => { setPickerItems(BRANCHES); setPickerOnSelect(() => setBranch); setPickerVisible(true); }}
            >
              <User style={styles.icon} color="#9ca3af" size={18} />
              <Text style={[styles.input, !branch && styles.placeholder]}>{branch || 'Branch'}</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.inputGroup]}
            onPress={() => { setPickerItems(PICKUP_POINTS); setPickerOnSelect(() => setPickupPoint); setPickerVisible(true); }}
          >
            <Bus style={styles.icon} color="#9ca3af" size={18} />
            <Text style={[styles.input, !pickupPoint && styles.placeholder]}>{pickupPoint || 'Pickup point'}</Text>
          </TouchableOpacity>

          {/* Route Details */}
          {routeDetails && (
            <View style={styles.routeInfo}>
              <Text style={styles.routeText}>
                <Text style={styles.routeLabel}>Assigned Bus: </Text>
                {routeDetails.busNumber}
              </Text>
              <Text style={styles.routeText}>
                <Text style={styles.routeLabel}>Route: </Text>
                {routeDetails.routeName}
              </Text>
            </View>
          )}

          {/* Phone */}
          <View style={styles.inputGroup}>
            <User style={styles.icon} color="#9ca3af" size={18} />
            <TextInput
              placeholder="Phone number"
              placeholderTextColor="#9ca3af"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              style={styles.input}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Lock style={styles.icon} color="#9ca3af" size={18} />
            <TextInput
              placeholder="Create password"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword(!showPassword)}
            >
              {showPassword ? <EyeOff color="#9ca3af" size={18} /> : <Eye color="#9ca3af" size={18} />}
            </TouchableOpacity>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputGroup}>
            <Lock style={styles.icon} color="#9ca3af" size={18} />
            <TextInput
              placeholder="Confirm password"
              placeholderTextColor="#9ca3af"
              secureTextEntry={!showConfirmPassword}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              style={styles.input}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowConfirmPassword(!showConfirmPassword)}
            >
              {showConfirmPassword ? (
                <EyeOff color="#9ca3af" size={18} />
              ) : (
                <Eye color="#9ca3af" size={18} />
              )}
            </TouchableOpacity>
          </View>

          {/* Signin Button */}
          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleSignin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Sign Up</Text>
            )}
          </TouchableOpacity>

          {/* Confirmation Modal */}
          {/* Confirmation Modal */}
          <Modal visible={showModal} transparent animationType="fade">
            <View style={styles.modalOverlay}>
              <View style={styles.modalCardLarge}>
                <Text style={styles.modalTitle}>Account Created Successfully ✅</Text>
                {createdUser ? (
                  <View style={styles.modalDetails}>
                    <Text style={styles.detailLine}><Text style={styles.detailLabel}>Name:</Text> {createdUser.name}</Text>
                    <Text style={styles.detailLine}><Text style={styles.detailLabel}>USN:</Text> {createdUser.usn}</Text>
                    <Text style={styles.detailLine}><Text style={styles.detailLabel}>Year:</Text> {createdUser.year}</Text>
                    <Text style={styles.detailLine}><Text style={styles.detailLabel}>Branch:</Text> {createdUser.branch}</Text>
                    <Text style={styles.detailLine}><Text style={styles.detailLabel}>Pickup:</Text> {createdUser.pickupPoint}</Text>
                    <Text style={styles.detailLine}><Text style={styles.detailLabel}>Phone:</Text> {createdUser.phone}</Text>
                  </View>
                ) : null}
                <TouchableOpacity
                  style={[styles.button, { marginTop: 12 }]}
                  onPress={() => {
                    setShowModal(false);
                    const go = onNavigateToLogin || (() => navigation?.navigate?.('Login'));
                    try { go(); } catch (e) { console.error('Navigation to login failed', e); }
                  }}
                >
                  <Text style={styles.buttonText}>Go to Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Picker Modal for Year/Branch/Pickup */}
          <Modal visible={pickerVisible} transparent animationType="slide">
            <View style={styles.pickerOverlay}>
              <View style={styles.pickerCard}>
                <Text style={styles.pickerTitle}>Select</Text>
                <ScrollView style={{ maxHeight: 300, width: '100%' }} showsVerticalScrollIndicator={true}>
                  {pickerItems.map((it, idx) => (
                    <TouchableOpacity key={idx} style={styles.pickerItem} onPress={() => { pickerOnSelect(it); setPickerVisible(false); }}>
                      <Text style={styles.pickerItemText}>{it}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <TouchableOpacity style={[styles.button, { marginTop: 8 }]} onPress={() => setPickerVisible(false)}>
                  <Text style={styles.buttonText}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </Modal>

          {/* Login Link */}
          <Text style={styles.loginText}>
            Already have an account?{' '}
            <Text style={styles.loginLink} onPress={() => {
              const go = onNavigateToLogin || (() => navigation?.navigate?.('Login'));
              try { go(); } catch (e) { console.error('Navigation to login failed', e); }
            }}>
              Sign In
            </Text>
          </Text>
        </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1 
  },
  keyboardView: {
    flex: 1,
    width: '100%'
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.85)',
    borderRadius: 24,
    padding: 24,
    width: '90%',
    maxWidth: 380,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 16,
  },
  title: { fontSize: 26, fontWeight: '700', color: '#111827', textAlign: 'center' },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 20, textAlign: 'center' },
  errorBox: {
    flexDirection: 'row',
    backgroundColor: '#fee2e2',
    borderRadius: 12,
    padding: 8,
    marginBottom: 12,
    alignItems: 'center',
  },
  errorText: { color: '#b91c1c', marginLeft: 6, fontSize: 13 },
  routeInfo: {
    backgroundColor: '#f0f9ff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  routeText: {
    fontSize: 14,
    marginBottom: 4,
    color: '#0369a1',
  },
  routeLabel: {
    fontWeight: '700',
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    marginBottom: 14,
    paddingHorizontal: 12,
  },
  icon: { marginRight: 8 },
  input: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 15,
    color: '#111827',
  },
  placeholder: { color: '#9ca3af' },
  rowInline: { flexDirection: 'row', justifyContent: 'space-between' },
  halfWidth: { width: '48%' },
  modalOverlay: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.45)' },
  modalCardLarge: { width: '86%', backgroundColor: '#fff', padding: 18, borderRadius: 16, alignItems: 'center' },
  modalDetails: { marginTop: 8, alignSelf: 'stretch' },
  detailLine: { fontSize: 15, marginVertical: 4 },
  detailLabel: { fontWeight: '700' },
  pickerOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.35)' },
  pickerCard: { 
    backgroundColor: '#fff', 
    padding: 16, 
    borderTopLeftRadius: 12, 
    borderTopRightRadius: 12, 
    alignItems: 'center',
    maxHeight: '80%'
  },
  pickerTitle: { 
    fontSize: 18, 
    fontWeight: '700', 
    marginBottom: 12,
    color: '#1f2937'
  },
  pickerItem: { 
    paddingVertical: 14,
    paddingHorizontal: 16, 
    width: '100%',
    borderBottomWidth: 1, 
    borderBottomColor: '#e5e7eb'
  },
  pickerItemText: { 
    fontSize: 16,
    color: '#374151'
  },
  eyeIcon: { padding: 4 },
  button: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  loginText: { color: '#4b5563', marginTop: 14, fontSize: 14 },
  loginLink: { color: '#4f46e5', fontWeight: '600' },
});

export default SigninPage;
