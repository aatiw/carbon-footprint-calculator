import mongoose, { Schema, Document } from 'mongoose';

export interface IEmissionFactor extends Document {
  category: string;
  subcategory: string;
  activity: string;
  unit: string;
  emissionFactor: number; // kg CO2e per unit
  source: string;
  year: number;
  region?: string;
  notes?: string;
}

const EmissionFactorSchema: Schema = new Schema<IEmissionFactor>({
  category: { 
    type: String, 
    required: true,
    index: true 
  },
  subcategory: { 
    type: String, 
    required: true,
    index: true 
  },
  activity: { 
    type: String, 
    required: true 
  },
  unit: { 
    type: String, 
    required: true 
  },
  emissionFactor: { 
    type: Number, 
    required: true 
  },
  source: { 
    type: String, 
    required: true 
  },
  year: { 
    type: Number, 
    required: true 
  },
  region: String,
  notes: String
}, {
  timestamps: true,
  collection: 'emission_factors'
});


EmissionFactorSchema.index({ category: 1, subcategory: 1, region: 1 });

export default mongoose.model<IEmissionFactor>('EmissionFactor', EmissionFactorSchema);