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

  analysis:{
    insights: Array<{
      type: string;
      title: string;
      description: string;
      value?: number;
      category?: string;
      priority: number;
    }>;
    hotspots: Array<{
      category: string;
      percentage: number;
      severity: "low" | "medium" | "high";
      reason: string;
    }>;
    comparisons: {
      category: string;
      message: string;
      percentile: number;
    };
  }

  recommendations: Array<{
    id: string;
    category: string;
    action: string;
    description: string;
    impact: {
      co2Reduction: number;
      percentage: number;
      timeframe: string;
    };
    difficulty: 'easy' | 'medium' | 'hard';
    cost: 'free' | 'low' | 'medium' | 'high';
    priority: number;
    steps: string[];
    benefits: string[];
    considerations: string[];
  }>
  
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

  analysis: {
    insights: [{
      type: String,
      title: String,
      description: String,
      value: Number,
      category: String,
      priority: Number,
    }],
    hotspots: [{
      category: String,
      percentage: Number,
      severity: {
        type: String,
        enum: ["low" , "medium" , "high"]
      },
      reason: String,
    }],
    comparisions: {
      category: String,
      message: String,
      percentile: Number,
    }
  },


  recommendations: {
    id: String,
    category: String,
    action: String,
    description: String,
    impact: {
      co2Reduction: Number,
      percentage: Number,
      timeframe: String,
    },
    difficulty: {
      type: String,
      enum: ['easy' , 'medium' ,'hard']
    },
    cost: {
      type: String,
      enum: ['free' , 'low' , 'medium' , 'high']
    },
    priority: Number,
    steps: [String],
    benefits: [String],
    considerations: [String]
  },

  
  calculatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true,
  collection: 'carbon_footprints'
});

export default mongoose.model<ICarbonFootprint>('CarbonFootprint', CarbonFootprintSchema);
