import mongoose, { Schema, Document } from 'mongoose';

export interface ISentMessage extends Document {
  whatsappMessageId: string;
  propertyId: mongoose.Types.ObjectId;
  mobile: string;
  createdAt: Date;
}

const SentMessageSchema: Schema = new Schema(
  {
    whatsappMessageId: { type: String, required: true, index: true },
    propertyId: { type: Schema.Types.ObjectId, ref: 'Property', required: true },
    mobile: { type: String, required: true },
    createdAt: { type: Date, default: Date.now } 
  }
);

export default mongoose.models.SentMessage || mongoose.model<ISentMessage>('SentMessage', SentMessageSchema);
