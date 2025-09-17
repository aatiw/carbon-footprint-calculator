import type { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import CarbonFootprint from '../models/CarbonFootPrint.js';
import type { ApiResponse, CarbonCalculationResult } from '../types';
import { calculateEmissions, QUICK_FACTORS } from '../utils/emissionFactors';


export const calculateFootprint = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    
    const user = await User.findOne({ sessionId });
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User data not found',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    
    const emissions = {
      transportation: calculateTransportationEmissions(user.transportation),
      homeEnergy: calculateHomeEnergyEmissions(user.homeEnergy),
      food: calculateFoodEmissions(user.foodDiet),
      water: calculateWaterEmissions(user.waterUsage),
      shopping: calculateShoppingEmissions(user.shopping)
    };
    
    
    const totalEmissions = Object.values(emissions).reduce((sum, category) => 
      sum + category.total, 0
    );
    
    
    const footprint = new CarbonFootprint({
      sessionId,
      totalEmissions,
      emissions,
      comparisons: {
        localAverage: getLocalAverage(user.location.country),
        nationalAverage: getNationalAverage(user.location.country),
        globalTarget: 2000, 
        percentile: calculatePercentile(totalEmissions, user.location.country)
      },
      calculatedAt: new Date()
    });
    
    await footprint.save();
    
    const response: ApiResponse<CarbonCalculationResult> = {
      success: true,
      data: {
        totalEmissions,
        categories: Object.entries(emissions).map(([name, data]) => ({
          name,
          value: data.total,
          percentage: (data.total / totalEmissions) * 100,
          subcategories: data.subcategories
        })),
        dailyAverage: totalEmissions / 365,
        monthlyAverage: totalEmissions / 12,
        yearlyTotal: totalEmissions
      },
      message: 'Carbon footprint calculated successfully',
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
};


export const getFootprintDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    
    const footprint = await CarbonFootprint.findOne({ sessionId })
      .sort({ calculatedAt: -1 });
    
    if (!footprint) {
      res.status(404).json({
        success: false,
        error: 'Footprint data not found',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    const response: ApiResponse = {
      success: true,
      data: footprint,
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
};


export const generateRecommendations = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    
    const footprint = await CarbonFootprint.findOne({ sessionId })
      .sort({ calculatedAt: -1 });
    
    if (!footprint) {
      res.status(404).json({
        success: false,
        error: 'Footprint data not found',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // TODO: Integrate with LangGraph agents for AI recommendations
    // For now, return rule-based recommendations
    const recommendations = generateRuleBasedRecommendations(footprint);
    
    // Update footprint with recommendations
    footprint.recommendations = recommendations;
    await footprint.save();
    
    const response: ApiResponse = {
      success: true,
      data: recommendations,
      message: 'Recommendations generated successfully',
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
};


export const createScenarios = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    
    const footprint = await CarbonFootprint.findOne({ sessionId })
      .sort({ calculatedAt: -1 });
    
    if (!footprint) {
      res.status(404).json({
        success: false,
        error: 'Footprint data not found',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    
    const scenarios = [
      {
        name: 'Quick Wins',
        description: 'Easy changes you can make today',
        newTotal: footprint.totalEmissions * 0.9,
        reduction: 10,
        actions: [
          'Switch to LED bulbs',
          'Reduce meat consumption by 1 day per week',
          'Use public transport once a week'
        ]
      },
      {
        name: 'Moderate Impact',
        description: 'Achievable changes over 6 months',
        newTotal: footprint.totalEmissions * 0.75,
        reduction: 25,
        actions: [
          'Install smart thermostat',
          'Adopt vegetarian diet 3 days per week',
          'Carpool or bike to work 2 days per week',
          'Reduce shopping by 30%'
        ]
      },
      {
        name: 'Climate Champion',
        description: 'Significant lifestyle changes for maximum impact',
        newTotal: footprint.totalEmissions * 0.5,
        reduction: 50,
        actions: [
          'Switch to renewable energy',
          'Adopt plant-based diet',
          'Use electric vehicle or public transport only',
          'Minimize consumption and maximize recycling'
        ]
      }
    ];
    
    footprint.scenarios = scenarios;
    await footprint.save();
    
    const response: ApiResponse = {
      success: true,
      data: scenarios,
      message: 'Scenarios created successfully',
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
};


export const compareWithBenchmarks = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    
    const footprint = await CarbonFootprint.findOne({ sessionId })
      .sort({ calculatedAt: -1 });
    
    if (!footprint) {
      res.status(404).json({
        success: false,
        error: 'Footprint data not found',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    const response: ApiResponse = {
      success: true,
      data: {
        userFootprint: footprint.totalEmissions,
        comparisons: footprint.comparisons,
        ranking: {
          category: getCarbonCategory(footprint.totalEmissions),
          message: getCarbonMessage(footprint.totalEmissions)
        }
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Helper functions
function calculateTransportationEmissions(transportation: any): any {
  const yearlyKm = (transportation.dailyCommuteDistance * 2 * 
                    transportation.commuteFrequency * 52) + 
                   (transportation.additionalWeeklyTravel * 52);
  
  let emissionFactor = QUICK_FACTORS.dailyCommuteCar;
  if (transportation.primaryMode === 'public_transport') {
    emissionFactor = QUICK_FACTORS.publicTransport;
  } else if (transportation.primaryMode === 'bike' || 
             transportation.primaryMode === 'walking') {
    emissionFactor = 0;
  }
  
  const total = yearlyKm * emissionFactor;
  
  return {
    total,
    commute: (transportation.dailyCommuteDistance * 2 * 
              transportation.commuteFrequency * 52) * emissionFactor,
    additionalTravel: (transportation.additionalWeeklyTravel * 52) * emissionFactor
  };
}

function calculateHomeEnergyEmissions(homeEnergy: any): any {
  // Simplified calculation - would be more complex in production
  const dailyKWh = (homeEnergy.dailyAppliances.acHeating * 2) +
                   (homeEnergy.dailyAppliances.television * 0.15) +
                   (homeEnergy.dailyAppliances.computer * 0.3) +
                   (homeEnergy.lightingHours * 0.06);
  
  const yearlyKWh = dailyKWh * 365;
  const emissionFactor = homeEnergy.renewableEnergy ? 0.05 : QUICK_FACTORS.electricity;
  
  return {
    total: yearlyKWh * emissionFactor,
    electricity: yearlyKWh * emissionFactor * 0.6,
    heating: yearlyKWh * emissionFactor * 0.3,
    appliances: yearlyKWh * emissionFactor * 0.1
  };
}

function calculateFoodEmissions(foodDiet: any): any {
  const mealsPerYear = 365 * 3;
  let mealEmission = QUICK_FACTORS.meatMeal;
  
  if (foodDiet.dietType === 'vegetarian') {
    mealEmission = QUICK_FACTORS.vegetarianMeal;
  } else if (foodDiet.dietType === 'vegan') {
    mealEmission = QUICK_FACTORS.veganMeal;
  }
  
  const wasteMultiplier = foodDiet.foodWaste === 'significant' ? 1.3 : 
                          foodDiet.foodWaste === 'moderate' ? 1.15 : 1.05;
  
  const total = mealsPerYear * mealEmission * wasteMultiplier;
  
  return {
    total,
    meat: total * 0.4,
    dairy: total * 0.2,
    other: total * 0.3,
    waste: total * 0.1
  };
}

function calculateWaterEmissions(waterUsage: any): any {
  const dailyLiters = (waterUsage.showerDuration * 12 * waterUsage.showerFrequency) +
                     (waterUsage.bathFrequency * 150 / 7) + 50; // Basic usage
  
  const yearlyLiters = dailyLiters * 365;
  const total = yearlyLiters * QUICK_FACTORS.waterLiter * 
                (waterUsage.waterSavingFixtures ? 0.7 : 1);
  
  return {
    total,
    usage: total * 0.6,
    heating: total * 0.4
  };
}

function calculateShoppingEmissions(shopping: any): any {
  const clothingItems = shopping.clothingFrequency === 'monthly' ? 36 :
                       shopping.clothingFrequency === 'quarterly' ? 12 :
                       shopping.clothingFrequency === 'biannually' ? 6 : 3;
  
  const electronicsItems = shopping.electronicsUpgrade === 'yearly' ? 2 :
                          shopping.electronicsUpgrade === 'every_2_years' ? 1 : 0.5;
  
  const total = (clothingItems * QUICK_FACTORS.clothingItem) +
                (electronicsItems * QUICK_FACTORS.electronicsItem);
  
  return {
    total,
    clothing: clothingItems * QUICK_FACTORS.clothingItem,
    electronics: electronicsItems * QUICK_FACTORS.electronicsItem,
    packaging: total * 0.1
  };
}

function getLocalAverage(country: string): number {
  const averages: { [key: string]: number } = {
    usa: 16000,
    uk: 8500,
    germany: 9600,
    france: 6800,
    china: 7500,
    india: 1900,
    japan: 9500,
    default: 4800
  };
  return averages[country.toLowerCase()]! || averages.default!;
}

function getNationalAverage(country: string): number {
  return getLocalAverage(country);
}

function calculatePercentile(emissions: number, country: string): number {
  const average = getLocalAverage(country);
  if (emissions <= average * 0.5) return 90;
  if (emissions <= average * 0.75) return 70;
  if (emissions <= average) return 50;
  if (emissions <= average * 1.25) return 30;
  return 10;
}

function getCarbonCategory(emissions: number): string {
  if (emissions < 2000) return 'Climate Hero';
  if (emissions < 4000) return 'Low Impact';
  if (emissions < 8000) return 'Average';
  if (emissions < 12000) return 'High Impact';
  return 'Very High Impact';
}

function getCarbonMessage(emissions: number): string {
  if (emissions < 2000) return 'Outstanding! You are well below the global target.';
  if (emissions < 4000) return 'Great job! You have a low carbon footprint.';
  if (emissions < 8000) return 'You are around average. There is room for improvement.';
  if (emissions < 12000) return 'Your footprint is above average. Consider our recommendations.';
  return 'Your footprint is significantly high. Urgent action recommended.';
}

function generateRuleBasedRecommendations(footprint: any): any[] {
  const recommendations = [];
  
  // Transportation recommendations
  if (footprint.emissions.transportation.total > 3000) {
    recommendations.push({
      category: 'Transportation',
      action: 'Switch to public transport or carpool 3 days per week',
      impact: footprint.emissions.transportation.total * 0.4,
      difficulty: 'easy',
      priority: 1
    });
  }
  
  // Energy recommendations
  if (footprint.emissions.homeEnergy.total > 2000) {
    recommendations.push({
      category: 'Home Energy',
      action: 'Switch to renewable energy provider',
      impact: footprint.emissions.homeEnergy.total * 0.7,
      difficulty: 'medium',
      priority: 2
    });
  }
  
  // Food recommendations
  if (footprint.emissions.food.total > 2500) {
    recommendations.push({
      category: 'Food',
      action: 'Reduce meat consumption to 3 days per week',
      impact: footprint.emissions.food.total * 0.3,
      difficulty: 'easy',
      priority: 3
    });
  }
  
  return recommendations;
}