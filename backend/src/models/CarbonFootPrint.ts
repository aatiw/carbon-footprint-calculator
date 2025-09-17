import mongoose, { Schema, Document } from 'mongoose';

export interface ICarbonFootprint extends Document {
  sessionId: string;
  
  // Total Emissions (kg CO2e per year)
  totalEmissions: number;
  
  // Category Breakdowns (kg CO2e per year)
  emissions: {
    transportation: {
      total: number;
      commute: number;
      additionalTravel: number;
    };
    homeEnergy: {
      total: number;
      electricity: number;
      heating: number;
      appliances: number;
    };
    food: {
      total: number;
      meat: number;
      dairy: number;
      other: number;
      waste: number;
    };
    water: {
      total: number;
      usage: number;
      heating: number;
    };
    shopping: {
      total: number;
      clothing: number;
      electronics: number;
      packaging: number;
    };
  };
  
  
  comparisons: {
    localAverage: number;
    nationalAverage: number;
    globalTarget: number;
    percentile: number;
  };
  
  
  recommendations: Array<{
    category: string;
    action: string;
    impact: number; // kg CO2e saved per year
    difficulty: 'easy' | 'medium' | 'hard';
    priority: number;
  }>;
  
  // Reduction Scenarios
  scenarios: Array<{
    name: string;
    description: string;
    newTotal: number;
    reduction: number; // percentage
    actions: string[];
  }>;
  
  calculatedAt: Date;
}

const CarbonFootprintSchema: Schema = new Schema<ICarbonFootprint>({
  sessionId: { 
    type: String, 
    required: true,
    index: true 
  },


  totalEmissions: { 
    type: Number, 
    required: true 
  },


  emissions: {
    transportation: {
      total: Number,
      commute: Number,
      additionalTravel: Number
    },
    homeEnergy: {
      total: Number,
      electricity: Number,
      heating: Number,
      appliances: Number
    },
    food: {
      total: Number,
      meat: Number,
      dairy: Number,
      other: Number,
      waste: Number
    },
    water: {
      total: Number,
      usage: Number,
      heating: Number
    },
    shopping: {
      total: Number,
      clothing: Number,
      electronics: Number,
      packaging: Number
    }
  },


  comparisons: {
    localAverage: Number,
    nationalAverage: Number,
    globalTarget: Number,
    percentile: Number
  },


  recommendations: [{
    category: String,
    action: String,
    impact: Number,
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard']
    },
    priority: Number
  }],


  scenarios: [{
    name: String,
    description: String,
    newTotal: Number,
    reduction: Number,
    actions: [String]
  }],

  
  calculatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true,
  collection: 'carbon_footprints'
});

export default mongoose.model<ICarbonFootprint>('CarbonFootprint', CarbonFootprintSchema);
