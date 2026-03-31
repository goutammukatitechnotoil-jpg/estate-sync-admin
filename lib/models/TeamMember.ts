import mongoose, { Schema, Document } from 'mongoose';

export interface ITeamMember extends Document {
  fullName: string;
  mobileNumber: string;
  email: string;
  roleId: mongoose.Types.ObjectId; // Reference to Role
  status: 'Active' | 'Inactive';
  createdAt: Date;
  updatedAt: Date;
  role?: any; // Populated role data
}

const TeamMemberSchema: Schema = new Schema({
  fullName: { type: String, required: true, trim: true },
  mobileNumber: {
    type: String,
    required: true,
    unique: true,
    match: /^\+91\d{10}$/,
    message: 'Mobile number must be in format: +91XXXXXXXXXX'
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v: string) {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Please enter a valid email address'
    }
  },
  roleId: {
    type: Schema.Types.ObjectId,
    ref: 'Role',
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
    required: true
  }
}, {
  timestamps: true
});

export default mongoose.models.TeamMember || mongoose.model<ITeamMember>('TeamMember', TeamMemberSchema);