import mongoose from 'mongoose';

const busLocationSchema = new mongoose.Schema({
  busNumber: {
    type: String,
    required: true,
    index: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [longitude, latitude]
      required: true
    }
  },
  speed: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  isActive: {
    type: Boolean,
    default: true
  },
  updatedBy: {
    type: String, // coordinator's phone number
    required: true
  }
});

// Create a 2dsphere index for geospatial queries
busLocationSchema.index({ location: '2dsphere' });

const BusLocation = mongoose.model('BusLocation', busLocationSchema);

export default BusLocation;