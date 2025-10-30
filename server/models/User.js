import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  usn: { type: String, required: true, unique: true, trim: true, uppercase: true },
  year: { type: Number, required: true },
  branch: { type: String, required: true, trim: true },
  pickupPoint: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  password: { type: String, required: true },
    routeName: { 
      type: String, 
      required: [true, 'Route name is required'],
      trim: true,
      validate: {
        validator: function(v) {
          console.log('🔍 Validating routeName:', v);
          return v && v.startsWith('Route ');
        },
        message: props => `${props.value} is not a valid route name. Must start with "Route "`
      }
    },
    busNumber: { 
      type: String, 
      required: [true, 'Bus number is required'],
      trim: true,
      validate: {
        validator: function(v) {
          console.log('🔍 Validating busNumber:', v);
          return v && v.startsWith('BUS');
        },
        message: props => `${props.value} is not a valid bus number. Must start with "BUS"`
      }
    },
  role: { type: String, enum: ['student', 'coordinator'], default: 'student' }
}, {
  timestamps: true
});

  // Add validation for route information
  userSchema.pre('validate', function(next) {
    // Log the document being validated
    console.log('🔍 Validating user document:', {
      routeName: this.routeName || 'MISSING',
      busNumber: this.busNumber || 'MISSING',
      pickupPoint: this.pickupPoint || 'MISSING'
    });

    if (!this.routeName?.trim()) {
      console.error('❌ Missing route name in validation');
      this.invalidate('routeName', 'Route name is required');
    }

    if (!this.busNumber?.trim()) {
      console.error('❌ Missing bus number in validation');
      this.invalidate('busNumber', 'Bus number is required');
    }

    // Validate route name format
    if (this.routeName && !this.routeName.startsWith('Route ')) {
      console.error('❌ Invalid route name format:', this.routeName);
      this.invalidate('routeName', 'Invalid route name format. Must start with "Route "');
    }

    // Validate bus number format
    if (this.busNumber && !this.busNumber.startsWith('BUS')) {
      console.error('❌ Invalid bus number format:', this.busNumber);
      this.invalidate('busNumber', 'Invalid bus number format. Must start with "BUS"');
    }

    next();
  });

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password for login
userSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);

export default User;