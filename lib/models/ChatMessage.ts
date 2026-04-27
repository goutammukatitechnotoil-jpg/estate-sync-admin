import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  userId: mongoose.Types.ObjectId;
  mobile: string;
  message: string;
  response: string;
  messageId?: string;
  timestamp: Date;
}

const ChatMessageSchema: Schema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'BotUser', required: true },
    mobile: { type: String, required: true },
    message: { type: String, required: true },
    response: { type: String, required: true },
    messageId: { type: String, unique: true, sparse: true },
    timestamp: { type: Date, default: Date.now },
  },
  {
    timestamps: true,
    collection: 'bot_chats' // Explicit collection name
  }
);

export default mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
