import mongoose, { Schema } from 'mongoose';

export interface IUserInput {
  sessionId: string;
  location: {
    country: string;
    city?: string;
    region?:string;
  };
  householdSize: number;
  

  transportation: {
    primaryMode: 'car' | 'public_transport' | 'bike' | 'walking' | 'work_from_home';
    dailyCommuteDistance: number; // km one way
    commuteFrequency: number; // days per week
    additionalWeeklyTravel: number; // km
    vehicleType?: 'petrol' | 'diesel' | 'electric' | 'hybrid';
    vehicleEfficiency?: number; // km per liter or kWh per 100km
  };
  

  homeEnergy: {
    homeType: 'apartment' | 'house' | 'shared';
    dailyAppliances: {
      acHeating: number; // hours
      television: number;
      computer: number;
      washingMachine: number;
      refrigerator: boolean;
      dishwasher: number;
    };
    lightingType: 'led' | 'cfl' | 'traditional';
    tubelights: number;
    bulbs: number;
    lightingHours: number;
    renewableEnergy: boolean;
    solarPanels?: boolean;
  };
  
  
  foodDiet: {
    dietType: 'vegetarian' | 'non_vegetarian' | 'vegan' | 'pescatarian';
    meatFrequency: number; // times per week
    dairyFrequency: number;
    localFoodPreference: 'always' | 'often' | 'sometimes' | 'rarely';
    foodWaste: 'minimal' | 'moderate' | 'significant';
    cookingFrequency: number; // meals per week at home
  };
  
  
  waterUsage: {
    showerDuration: number; // minutes per day
    showerFrequency: number; // times per day
    bathFrequency: number; // times per week
    personalUtilities: number; //including daily washroom uses apart from shower
    tapHabits: 'conscious' | 'normal' | 'wasteful';
    noOfUtensils: number;
    carWashing: number; // times per month
  };
  
  
  shopping: {
    clothingFrequency: 'monthly' | 'quarterly' | 'biannually' | 'annually';
    electronicsUpgrade: 'yearly' | 'every_2_years' | 'every_3_years' | 'longer';
    packagingPreference: 'minimal' | 'normal' | 'convenience';
    recyclingHabits: 'always' | 'often' | 'sometimes' | 'never';
    composting: boolean;
  };
  
  createdAt?: Date;
  updatedAt?: Date;
}

const UserSchema: Schema = new Schema<IUserInput>({
  sessionId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  location: {
    country: { type: String, required: true },
    city: String,
    region: String,
  },
  householdSize: { 
    type: Number, 
    required: true, 
    min: 1 
  },


  transportation: {
    primaryMode: {
      type: String,
      enum: ['car', 'public_transport', 'bike', 'walking', 'work_from_home'],
      required: true
    },
    dailyCommuteDistance: { type: Number, required: true, min: 0 },
    commuteFrequency: { type: Number, required: true, min: 0, max: 7 },
    additionalWeeklyTravel: { type: Number, default: 0 },
    carpooling: { type: Boolean, default: false },
    vehicleType: {
      type: String,
      enum: ['petrol', 'diesel', 'electric', 'hybrid']
    },
    vehicleEfficiency: Number
  },


  homeEnergy: {
    homeType: {
      type: String,
      enum: ['apartment', 'house', 'shared'],
      required: true
    },
    dailyAppliances: {
      acHeating: { type: Number, default: 0 },
      television: { type: Number, default: 0 },
      computer: { type: Number, default: 0 },
      washingMachine: { type: Number, default: 0 },
      refrigerator: { type: Boolean, default: true },
      dishwasher: { type: Number, default: 0 }
    },
    lightingType: {
      type: String,
      enum: ['led', 'cfl', 'traditional'],
      required: true
    },
    tubelights:{
        type: Number, required: true
    },
    bulbs: {
        type: Number, required: true
    },
    lightingHours: { type: Number, required: true },
    renewableEnergy: { type: Boolean, default: false },
    solarPanels: { type: Boolean, default: false }
  },


  foodDiet: {
    dietType: {
      type: String,
      enum: ['vegetarian', 'non_vegetarian', 'vegan', 'pescatarian'],
      required: true
    },
    meatFrequency: { type: Number, default: 0 },
    dairyFrequency: { type: Number, default: 0 },
    localFoodPreference: {
      type: String,
      enum: ['always', 'often', 'sometimes', 'rarely'],
      default: 'sometimes'
    },
    foodWaste: {
      type: String,
      enum: ['minimal', 'moderate', 'significant'],
      default: 'moderate'
    },
    cookingFrequency: { type: Number, default: 14 }
  },


  waterUsage: {
    showerDuration: { type: Number, required: true },
    showerFrequency: { type: Number, default: 1 },
    bathFrequency: { type: Number, default: 0 },
    tapHabits: {
      type: String,
      enum: ['conscious', 'normal', 'wasteful'],
      default: 'normal'
    },
    personalUtilities: { type: Number, default: 0 },
    noOfUtensils: {type: Number, default: 0},
    carWashing: { type: Number, default: 0 },
    waterSavingFixtures: { type: Boolean, default: false }
  },


  shopping: {
    clothingFrequency: {
      type: String,
      enum: ['monthly', 'quarterly', 'biannually', 'annually'],
      default: 'quarterly',
      required: true
    },
    electronicsUpgrade: {
      type: String,
      enum: ['yearly', 'every_2_years', 'every_3_years', 'longer'],
      default: 'every_2_years'
    },
    packagingPreference: {
      type: String,
      enum: ['minimal', 'normal', 'convenience'],
      default: 'normal'
    },
    recyclingHabits: {
      type: String,
      enum: ['always', 'often', 'sometimes', 'never'],
      default: 'often'
    },
    composting: { type: Boolean, default: false }
  }

}, {
  timestamps: true,
  collection: 'users'
});

export default mongoose.model<IUserInput>('User', UserSchema);