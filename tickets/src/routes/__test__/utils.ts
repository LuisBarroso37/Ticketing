import mongoose from 'mongoose';

// Generate mongoose id
export const generateId = () => new mongoose.Types.ObjectId().toHexString();
