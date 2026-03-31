import mongoose, { Schema, Document } from 'mongoose';

export interface IRole extends Document {
  name: string;
  status: 'Active' | 'Inactive';
  permissions: {
    properties: {
      view: boolean;
      edit: boolean;
    };
    categories: {
      view: boolean;
      edit: boolean;
    };
    teamMembers: {
      view: boolean;
      edit: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const RoleSchema: Schema = new Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
    required: true
  },
  permissions: {
    properties: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    },
    categories: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    },
    teamMembers: {
      view: { type: Boolean, default: false },
      edit: { type: Boolean, default: false }
    }
  }
}, {
  timestamps: true
});

// Create indexes
RoleSchema.index({ name: 1 });
RoleSchema.index({ status: 1 });

export default mongoose.models.Role || mongoose.model<IRole>('Role', RoleSchema);