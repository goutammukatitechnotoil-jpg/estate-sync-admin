import mongoose, { Schema, Document } from 'mongoose';

export interface ICategoryField {
  name: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'multiselect' | 'checkbox' | 'radio';
  required: boolean;
  placeholder?: string;
  helpText?: string;
  options?: string[]; // Used for select, multiselect, radio
}

export interface ICategory extends Document {
  name: string;
  fields: ICategoryField[];
  status: number; // 1 = active, 0 = deleted
}

const CategoryFieldSchema: Schema = new Schema({
  name: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, enum: ['text', 'number', 'select', 'multiselect', 'checkbox', 'radio'], required: true },
  required: { type: Boolean, default: false },
  placeholder: { type: String },
  helpText: { type: String },
  options: { type: [String], default: [] },
}, { _id: false });

const CategorySchema: Schema = new Schema(
  {
    name: { type: String, required: true, unique: true },
    fields: [CategoryFieldSchema],
    status: { type: Number, default: 1 }, // 1 = active, 0 = deleted
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Category || mongoose.model<ICategory>('Category', CategorySchema);
