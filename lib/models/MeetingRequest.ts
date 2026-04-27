import mongoose from 'mongoose';

const meetingRequestSchema = new mongoose.Schema({
  propertyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Property', required: true },
  botUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'BotUser' }, // Optional, if they came via Whatsapp link
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  email: { type: String, required: true },
  preferredDate: { type: String, required: true },
  preferredTime: { type: String, required: true },
  message: { type: String },
  status: { type: String, enum: ['Pending', 'Scheduled', 'Completed', 'Cancelled'], default: 'Pending' },
}, { timestamps: true });

export default mongoose.models.MeetingRequest || mongoose.model('MeetingRequest', meetingRequestSchema);
