import mongoose, { Schema, Document } from 'mongoose';

export interface IBotUser extends Document {
  mobile: string;
  name?: string;
  status: 'name_pending' | 'active';
  leadStatus: 'cold' | 'warm' | 'hot';
  lastPropertyInterest?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BotUserSchema: Schema = new Schema(
  {
    mobile: { type: String, required: true, unique: true },
    name: { type: String },
    status: { type: String, enum: ['name_pending', 'active'], default: 'name_pending' },
    leadStatus: { type: String, enum: ['cold', 'warm', 'hot'], default: 'cold' },
    lastPropertyInterest: { type: Schema.Types.ObjectId, ref: 'Property' }
  },
  {
    timestamps: true,
    collection: 'bot_users'
  }
);

export default mongoose.models.BotUser || mongoose.model<IBotUser>('BotUser', BotUserSchema);
