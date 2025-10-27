import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react-native';
import { authAPI } from './services/api';

const LoginPage = ({ onNavigateToSignin, onLoginSuccess }) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setError('');
    if (!userId || !password) {
      setError('Please fill all the fields.');
      return;
    }

    setLoading(true);
    try {
  const response = await authAPI.login({ usn: userId, password });
  onLoginSuccess(response.user);
    } catch (err) {
      // Show friendly message from API client
      setError(err?.message || String(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={['#c7d2fe', '#e9d5ff', '#fbcfe8']}
      style={styles.container}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}
      >
        <View style={styles.card}>
          {/* 🏫 Canara College Logo */}
          <Image
            source={require('../assets/canara-logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.title}>Login Page</Text>
          <Text style={styles.subtitle}>
            Sign in to continue to <Text style={{ fontWeight: 'bold' }}>Can-Track</Text>
          </Text>

          {error ? (
            <View style={styles.errorBox}>
              <AlertCircle color="#ef4444" size={18} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* USN Input */}
          <View style={styles.inputGroup}>
            <User style={styles.icon} color="#9ca3af" size={18} />
            <TextInput
              placeholder="Enter your USN"
              placeholderTextColor="#9ca3af"
              value={userId}
              onChangeText={setUserId}
              autoCapitalize="characters"
              style={styles.input}
            />
          </View>

          {/* Password Input */}
          <View style={styles.inputGroup}>
            <Lock style={styles.icon} color="#9ca3af" size={18} />
            <TextInput
              placeholder="Enter your password"
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

          {/* Sign In Button */}
          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.6 }]}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <LinearGradient colors={[ '#4f46e5', '#7c3aed' ]} style={styles.buttonGradient}>
                <Text style={styles.buttonText}>Sign In</Text>
              </LinearGradient>
            )}
          </TouchableOpacity>

          {/* Sign Up Link */}
          <Text style={styles.signinText}>
            Don’t have an account?{' '}
            <Text style={styles.signinLink} onPress={onNavigateToSignin}>
              Sign Up
            </Text>
          </Text>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
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
  eyeIcon: { padding: 4 },
  button: {
    borderRadius: 12,
    paddingVertical: 0,
    width: '100%',
    alignItems: 'center',
    marginTop: 8,
  },
  buttonGradient: {
    paddingVertical: 12,
    width: '100%',
    borderRadius: 12,
    alignItems: 'center'
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 16 },
  signinText: { color: '#4b5563', marginTop: 14, fontSize: 14 },
  signinLink: { color: '#4f46e5', fontWeight: '600' },
});

export default LoginPage;
