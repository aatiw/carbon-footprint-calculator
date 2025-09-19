import type { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import CarbonFootprint from '../models/CarbonFootPrint.js';
import type { ApiResponse, CarbonCalculationResult } from '../types';
import { AgentIntegrationService } from '../services/agentIntegration.service';
import {v4 as uuidv4 } from 'uuid';
import type { FootprintAnalysis } from '../agents/Analysis.agent';
import type { DashboardInsight } from '../agents/dashboard.agent';


type ExtendedCarbonResult = CarbonCalculationResult & {
  analysis?: FootprintAnalysis;
  dashboardInsights?: DashboardInsight[];
};

interface FootprintOptions {
  includeRecommendations?: boolean;
  includeScenarios?: boolean;
  includeDashboard?: boolean;
}


const agentService = AgentIntegrationService.getInstance();

export const calculateFootprint = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId}  = req.params;

    const { options } = req.query as { options?: FootprintOptions };
    
    const user = await User.findOne({ sessionId });
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User data not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const benchmarks = {
      localAverage: getLocalAverage(user.location.country),
      nationalAverage: getNationalAverage(user.location.country),
      globalTarget: 2000,
    };
    
    const aiResult = await agentService.calculateFootprint(user, benchmarks, options);

    const footprintId = uuidv4();
    
    const footprint = new CarbonFootprint({
      sessionId,
      footprintId,
      totalEmissions: aiResult.totalEmissions,
      emissions: {
        transportation: aiResult.categories.find(c => c.name === 'transportation')?.subcategories || { total: 0 },
        homeEnergy: aiResult.categories.find(c => c.name === 'homeEnergy')?.subcategories || { total: 0 },
        food: aiResult.categories.find(c => c.name === 'food')?.subcategories || { total: 0 },
        water: aiResult.categories.find(c => c.name === 'water')?.subcategories || { total: 0 },
        shopping: aiResult.categories.find(c => c.name === 'shopping')?.subcategories || { total: 0 }
      },
      comparisons: {
        localAverage: benchmarks.localAverage,
        nationalAverage: benchmarks.nationalAverage,
        globalTarget: benchmarks.globalTarget,
        percentile: calculatePercentile(aiResult.totalEmissions, user.location.country)
      },
      analysis: aiResult.analysis,
      recommendations: aiResult.recommendations || [],
      calculatedAt: new Date()
    });
    
    await footprint.save();
    
    const response: ApiResponse<ExtendedCarbonResult> = {
      success: true,
      data: {
        totalEmissions: aiResult.totalEmissions,
        categories: aiResult.categories,
        dailyAverage: aiResult.dailyAverage,
        monthlyAverage: aiResult.monthlyAverage,
        yearlyTotal: aiResult.yearlyTotal,
        analysis: aiResult.analysis,
        dashboardInsights: aiResult.dashboardInsights
      },
      message: 'Carbon footprint calculated successfully',
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error in calculateFootprint:', error);
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
    console.error("error in getFootprintDetails", error);
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
    
    const [user, footprint]= await Promise.all([
      User.findOne({sessionId}),
      CarbonFootprint.findOne({ sessionId }).sort({ calculatedAt: -1 }),
    ])
    
    if (!footprint || !user) {
      res.status(404).json({
        success: false,
        error: 'Footprint data not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const footprintData = {
      totalEmissions: footprint.totalEmissions,
      emissions: footprint.emissions,
    };
    
    const recommendations = await agentService.generateRecommendations(
      footprintData,
      user,
      footprint.analysis
    );
    
    
    footprint.recommendations = recommendations;
    await footprint.save();
    
    const response: ApiResponse = {
      success: true,
      data: recommendations,
      message: 'AI recommendations generated successfully',
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error generating recommendations:', error);
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
    console.error("eeror in compareWithBenchmarks", error);
    next(error);
  }
};

// Helper functions
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