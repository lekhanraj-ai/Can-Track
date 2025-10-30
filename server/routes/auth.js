import express from 'express';
import User from '../models/User.js';
import { findBusDetailsByStop } from '../utils/routeHelper.js';

const router = express.Router();

// Signup Route - expects: { name, usn, year, branch, pickupPoint, phone, password }
router.post('/signup', async (req, res) => {
  try {
    console.log('📝 Signup Request Body:', { ...req.body, password: '[REDACTED]' });
    
    // Log the raw request body for debugging
    console.log('Raw request body type:', typeof req.body);
    console.log('Raw request body keys:', Object.keys(req.body));
    
    let { 
      name, 
      usn, 
      year, 
      branch, 
      pickupPoint, 
      phone, 
      password,
      routeName,
      busNumber 
    } = req.body;

    // Coerce types where reasonable (clients sometimes send strings)
    year = year !== undefined ? Number(year) : year;
    phone = phone ? String(phone) : phone;
    
    // Log individual fields for debugging
    console.log('Parsed fields:', {
      name: typeof name,
      usn: typeof usn,
      year: typeof year + ' - ' + year,
      branch: typeof branch,
      pickupPoint: typeof pickupPoint,
      phone: typeof phone,
      routeName: typeof routeName,
      busNumber: typeof busNumber
    });
      console.log('🔍 Route information received:', {
        routeName: routeName || 'MISSING',
        busNumber: busNumber || 'MISSING',
        pickupPoint: pickupPoint || 'MISSING'
      });

      // Enhanced validation with type checking
      const missingFields = [];
      const validationErrors = [];

      // Basic field presence validation
      if (!name?.trim()) missingFields.push('name');
      if (!usn?.trim()) missingFields.push('usn');
      if (!year) missingFields.push('year');
      if (!branch?.trim()) missingFields.push('branch');
      if (!pickupPoint?.trim()) missingFields.push('pickupPoint');
      if (!phone?.trim()) missingFields.push('phone');
      if (!password) missingFields.push('password');
    
      // If route info not provided explicitly, try to derive from pickupPoint
      let derivedRoute = null;
      if (!routeName || !busNumber) {
        try {
          derivedRoute = findBusDetailsByStop(pickupPoint);
          if (derivedRoute) {
            routeName = routeName || derivedRoute.routeName;
            busNumber = busNumber || derivedRoute.busNumber;
            console.log('ℹ️ Derived route info from pickupPoint:', derivedRoute);
          } else {
            console.log('ℹ️ Could not derive route info from pickupPoint:', pickupPoint);
          }
        } catch (e) {
          console.error('Error deriving route info:', e);
        }
      }

      // Special validation for route information
      if (!routeName?.trim()) {
        missingFields.push('routeName');
        validationErrors.push('Route name is required');
      }
      if (!busNumber?.trim()) {
        missingFields.push('busNumber');
        validationErrors.push('Bus number is required');
      }

      // Validate route information format
      if (routeName && !routeName.startsWith('Route ')) {
        validationErrors.push('Invalid route name format. Must start with "Route "');
      }
      if (busNumber && !busNumber.startsWith('BUS')) {
        validationErrors.push('Invalid bus number format. Must start with "BUS"');
      }

    if (missingFields.length > 0) {
      // If only route fields are missing, supply safe defaults to avoid Mongoose validation failure
      const nonRouteMissing = missingFields.filter(f => f !== 'routeName' && f !== 'busNumber');
      if (nonRouteMissing.length > 0) {
        console.error('❌ Validation Error: Missing required non-route fields:', nonRouteMissing);
        return res.status(400).json({ 
          error: 'Missing required fields', 
          missingFields: nonRouteMissing,
          validationErrors
        });
      }

      // Only route fields missing — use safe defaults but log a warning
      console.warn('⚠️ Only route fields missing. Applying safe defaults to avoid save error.');
      if (!routeName || !routeName.trim()) routeName = 'Route Unknown';
      if (!busNumber || !busNumber.trim()) busNumber = 'BUS000';
      console.warn('⚠️ Applied defaults:', { routeName, busNumber });
    }

    // Additional validation
    if (typeof year !== 'number' || year < 1 || year > 4) {
      console.log('❌ Validation Error: Invalid year value:', year);
      return res.status(400).json({ error: 'Year must be a number between 1 and 4' });
    }

    if (!/^\d{10}$/.test(phone)) {
      console.log('❌ Validation Error: Invalid phone number:', phone);
      return res.status(400).json({ error: 'Phone number must be 10 digits' });
    }

    // normalize
    const normalizedUsn = String(usn).toUpperCase();
    console.log('🔍 Checking for existing USN:', normalizedUsn);

    // Check if USN already exists
    const existingUser = await User.findOne({ usn: normalizedUsn });
    if (existingUser) {
      console.log('❌ Duplicate USN found:', normalizedUsn);
      return res.status(400).json({ error: 'USN already registered' });
    }

    // At this point routeName and busNumber should be present (derived or provided)
    console.log('ℹ️ Final route info to be saved:', { routeName, busNumber });

    console.log('✨ Creating new user with USN:', normalizedUsn);
    const user = new User({ 
      name, 
      usn: normalizedUsn, 
      year, 
      branch, 
      pickupPoint, 
      phone, 
      password,
      routeName,
      busNumber
    });
    
    try {
      // Log the full document before saving
      console.log('📝 Attempting to save user document:', {
        ...user.toObject(),
        password: '[REDACTED]',
        routeInfo: { routeName, busNumber }
      });

      await user.save();

      // Log successful save
      console.log('✅ User saved successfully with USN:', user.usn);

      // Return user info excluding password
      res.status(201).json({
        message: 'User created successfully',
        user: {
          usn: user.usn,
          name: user.name,
          year: user.year,
          branch: user.branch,
          pickupPoint: user.pickupPoint,
          phone: user.phone,
          routeName: user.routeName,
          busNumber: user.busNumber
        }
      });
    } catch (saveError) {
      // Enhanced error logging
      console.error('❌ MongoDB Save Error Details:', {
        name: saveError.name,
        message: saveError.message,
        code: saveError.code,
        keyPattern: saveError.keyPattern,
        keyValue: saveError.keyValue,
        index: saveError.index,
        driver: saveError.driver,
        writeErrors: saveError.writeErrors,
        full: saveError
      });
      
      // Handle specific MongoDB errors
      if (saveError.code === 11000) {
        return res.status(400).json({ 
          error: 'Duplicate key error',
          field: Object.keys(saveError.keyPattern)[0]
        });
      }
      
      // Handle validation errors
      if (saveError.name === 'ValidationError') {
        const validationErrors = Object.keys(saveError.errors).reduce((acc, key) => {
          acc[key] = saveError.errors[key].message;
          return acc;
        }, {});
        
        return res.status(400).json({ 
          error: 'Validation error',
          validationErrors 
        });
      }
      
      throw saveError; // Re-throw for general error handler
    }
  } catch (error) {
    console.error('❌ Signup Error:', {
      name: error.name,
      message: error.message,
      stack: error.stack
    });
    res.status(500).json({ 
      error: 'Error creating user',
      details: error.message 
    });
  }
});

// Login Route - expects: { usn, password }
router.post('/login', async (req, res) => {
  try {
    const { usn, password } = req.body;
    if (!usn || !password) return res.status(400).json({ error: 'USN and password are required' });

    const normalizedUsn = String(usn).toUpperCase();
    console.log('🔐 Login attempt for USN:', normalizedUsn);
    const user = await User.findOne({ usn: normalizedUsn });
    if (!user) {
      console.warn('🔍 Login failed - user not found:', normalizedUsn);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      console.warn('🔒 Login failed - password mismatch for USN:', normalizedUsn);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Get bus details based on pickup point
    const busDetails = findBusDetailsByStop(user.pickupPoint);
    console.log('Found bus details for pickup point:', busDetails);
    
    // If bus details not found, assign them based on user's existing data or found route
    const routeName = user.routeName || busDetails?.routeName;
    const busNumber = user.busNumber || busDetails?.busNumber;

    // Update user with bus details if not already set
    if (busDetails && (!user.routeName || !user.busNumber)) {
      user.routeName = busDetails.routeName;
      user.busNumber = busDetails.busNumber;
      await user.save();
      console.log('Updated user with bus details:', { routeName: user.routeName, busNumber: user.busNumber });
    }

    res.json({
      message: 'Login successful',
      user: {
        usn: user.usn,
        name: user.name,
        year: user.year,
        branch: user.branch,
        pickupPoint: user.pickupPoint,
        phone: user.phone,
        routeName: routeName,
        busNumber: busNumber
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Error during login' });
  }
});

export default router;