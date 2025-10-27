import mongoose from 'mongoose';

// UserDetails model removed — exporting a harmless empty schema to avoid runtime errors if imported
const userDetailsSchema = new mongoose.Schema({}, { strict: false });
const UserDetails = mongoose.model('UserDetails', userDetailsSchema);

export default UserDetails;