import mongoose, { Schema, Document } from 'mongoose';

export interface IProperty extends Document {
  title: string;
  category: string;
  listingPurpose: string;
  pricingType: 'fixed' | 'range'; // New: fixed price or price range
  price?: number; // For fixed pricing
  minPrice?: number; // For range pricing
  maxPrice?: number; // For range pricing
  priceType: string;
  city: string;
  locality: string;
  address?: string;
  mapLink?: string;
  area?: number;
  furnishing?: string;
  propertyAge?: string;
  facing?: string;
  highlights: string[];
  amenities: string[];
  images: string[]; // stored as data URLs
  videos: string[]; // New: video files
  documents: string[]; // New: document files
  videoLink?: string;
  availability: boolean;
  status: number; // 1 = active, 0 = deleted (soft delete)
  createdBy?: any;
  dynamicData?: { [key: string]: any }; // Stores dynamically generated, category-specific configurations
  // Conditional fields
  bhkType?: string; // Flat/Apartment
  propertyFloorNumber?: number; // Flat/Apartment
  totalFloorsInBuilding?: number; // Flat/Apartment
  bedrooms?: number; // Villa/House
  numberOfFloors?: number; // Villa/House
  plotArea?: number; // Villa/House & Plot/Land
  commercialType?: string; // Commercial
  floorNumber?: number; // Commercial
  propertyDescription?: string; // Other
}

const PropertySchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    category: { type: String, required: true },
    listingPurpose: { type: String, required: true },
    pricingType: { type: String, enum: ['fixed', 'range'], default: 'fixed' },
    price: { type: Number },
    minPrice: { type: Number },
    maxPrice: { type: Number },
    priceType: { type: String, required: true },
    city: { type: String, required: true },
    locality: { type: String, required: true },
    address: { type: String },
    mapLink: { type: String },
    area: { type: Number },
    furnishing: { type: String },
    propertyAge: { type: String },
    facing: { type: String },
    highlights: { type: [String], default: [] },
    amenities: { type: [String], default: [] },
    images: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    documents: { type: [String], default: [] },
    videoLink: { type: String },
    availability: { type: Boolean, default: true },
    status: { type: Number, default: 1 }, // 1 = active, 0 = deleted
    createdBy: { type: Schema.Types.ObjectId, ref: 'Admin' },
    dynamicData: { type: Schema.Types.Mixed, default: {} },
    bhkType: { type: String },
    propertyFloorNumber: { type: Number },
    totalFloorsInBuilding: { type: Number },
    bedrooms: { type: Number },
    numberOfFloors: { type: Number },
    plotArea: { type: Number },
    commercialType: { type: String },
    floorNumber: { type: Number },
    propertyDescription: { type: String },
  },
  {
    timestamps: true,
  }
);
// Database Optimization: Indexes for highly filtered fields
PropertySchema.index({ status: 1, createdAt: -1 });
PropertySchema.index({ category: 1 });
PropertySchema.index({ city: 1, locality: 1 });
PropertySchema.index({ price: 1 });
PropertySchema.index({ availability: 1 });

export default mongoose.models.Property || mongoose.model<IProperty>('Property', PropertySchema);
