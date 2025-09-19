import type { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import CarbonFootprint from '../models/CarbonFootPrint.js';
import type { ApiResponse } from '../types';
import { AgentIntegrationService } from '../services/agentIntegration.service';
import DashboardData from '../models/DashboardData';

const agentService = AgentIntegrationService.getInstance();


export const getDashboardData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    
    
    const [user, footprint] = await Promise.all([
      User.findOne({ sessionId }),
      CarbonFootprint.findOne({ sessionId }).sort({ calculatedAt: -1 })
    ]);
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'User session not found',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    if (!footprint) {
      res.status(404).json({
        success: false,
        error: 'Carbon footprint not calculated yet',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    
    const benchmarks = footprint.comparisons;
    const footprintData = {
      totalEmissions: footprint.totalEmissions,
      emissions: footprint.emissions
    };

    const insights = await agentService.generateDashboardInsights(footprintData, user, benchmarks);

    const goals = calculateGoalProgress(footprint);
    
    const dashboardData = {
      user: {
        sessionId: user.sessionId,
        location: user.location,
        householdSize: user.householdSize
      },
      footprint: {
        totalEmissions: footprint.totalEmissions,
        dailyAverage: footprint.totalEmissions / 365,
        monthlyAverage: footprint.totalEmissions / 12,
        categories: Object.entries(footprint.emissions).map(([name, data]: [string, any]) => ({
          name,
          value: data.total,
          percentage: (data.total / footprint.totalEmissions) * 100,
          subcategories: data
        })),
        calculatedAt: footprint.calculatedAt
      },
      comparisons: footprint.comparisons,
      recommendations: footprint.recommendations || [],
      insights,
      goals,
    };

    await DashboardData.create({
      sessionId,
      footprintId: footprint._id,
      goals,
      dashboardInsights: insights,
    });
    
    const response: ApiResponse = {
      success: true,
      data: dashboardData,
      message: 'Dashboard data retrieved successfully',
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error in getDashboardData:', error);
    next(error);
  }
};


export const getChartData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId, chartType } = req.params;
    
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

    const footprintData = {
      totalEmissions: footprint.totalEmissions,
      emissions: footprint.emissions
    };
    
    let chartData;
    
    if (['pie', 'bar', 'waterfall', 'comparison', 'scenarios'].includes(chartType!)) {
      chartData = await agentService.generateChartData(footprintData, chartType!);
    } else if (chartType === 'trends') {
      chartData = await generateTrendsChartData(sessionId!);
    } else {
      res.status(400).json({
        success: false,
        error: 'Invalid chart type',
        timestamp: new Date().toISOString()
      });
      return;
    }

    await DashboardData.findOneAndUpdate(
      { sessionId, footprintId: footprint._id },
      {
        $set: {
          chartType: {
            type: chartType,
            data: chartData.data || chartData,
            options: chartData.options || {},
            insights: chartData.insights || [],
          } 
        }
      },
      { upsert: true, new: true }
    );
    
    const response: ApiResponse = {
      success: true,
      data: chartData,
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
};


export const exportReport = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    const { format = 'pdf' } = req.query;
    
    const [user, footprint] = await Promise.all([
      User.findOne({ sessionId }),
      CarbonFootprint.findOne({ sessionId }).sort({ calculatedAt: -1 })
    ]);
    
    if (!user || !footprint) {
      res.status(404).json({
        success: false,
        error: 'Required data not found',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    const reportData = {
      generatedAt: new Date(),
      user: {
        location: user.location,
        householdSize: user.householdSize
      },
      summary: {
        totalEmissions: footprint.totalEmissions,
        dailyAverage: Math.round(footprint.totalEmissions / 365),
        category: getCarbonCategory(footprint.totalEmissions),
        percentile: footprint.comparisons.percentile
      },
      breakdown: Object.entries(footprint.emissions).map(([name, data]: [string, any]) => ({
        category: name,
        emissions: data.total,
        percentage: Math.round((data.total / footprint.totalEmissions) * 100)
      })),
      benchmarks: {
        userFootprint: footprint.totalEmissions,
        localAverage: footprint.comparisons.localAverage,
        nationalAverage: footprint.comparisons.nationalAverage,
        globalTarget: footprint.comparisons.globalTarget
      },
      recommendations: footprint.recommendations?.slice(0, 5) || [],
    };
    
    // TODO: Implement PDF/CSV generation based on format
    // For now, return JSON data
    if (format === 'json') {
      const response: ApiResponse = {
        success: true,
        data: reportData,
        message: 'Report exported successfully',
        timestamp: new Date().toISOString()
      };
      
      res.json(response);
    } else {
      // TODO: Generate PDF using puppeteer or similar
      res.status(501).json({
        success: false,
        error: 'PDF export not yet implemented',
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    console.error('Error exporting report:', error);
    next(error);
  }
};


export const getReductionPotential = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    
    const [user, footprint] = await Promise.all([
      User.findOne({ sessionId }),
      CarbonFootprint.findOne({ sessionId }).sort({ calculatedAt: -1 })
    ]);
    
    if (!footprint || !user) {
      res.status(404).json({
        success: false,
        error: 'Required data not found',
        timestamp: new Date().toISOString()
      });
      return;
    }

    const footprintData = {
      totalEmissions: footprint.totalEmissions,
      emissions: footprint.emissions
    };
    
    const reductionPotential = await agentService.calculateReductionPotential(
      footprintData, 
      user
    );
    
    const response: ApiResponse = {
      success: true,
      data: reductionPotential,
      message: 'Reduction potential calculated successfully',
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    console.error('Error calculating reduction potential:', error);
    next(error);
  }
};

// Helper functions
function calculateGoalProgress(footprint: any): any {
  const globalTarget = 2000; // 2 tons CO2e per year
  const current = footprint.totalEmissions;
  
  return {
    current,
    target: globalTarget,
    progress: Math.min((globalTarget / current) * 100, 100),
    remaining: Math.max(current - globalTarget, 0),
    achieved: current <= globalTarget
  };
}

async function generateTrendsChartData(sessionId: string): Promise<any> {
  const footprints = await CarbonFootprint.find({ sessionId })
    .sort({ calculatedAt: 1 })
    .limit(12);
  
  if (footprints.length < 2) {
    return { message: 'Not enough data for trends' };
  }
  
  return {
    labels: footprints.map(fp => new Date(fp.calculatedAt).toLocaleDateString()),
    datasets: [{
      label: 'Total Emissions (kg CO₂e)',
      data: footprints.map(fp => fp.totalEmissions),
      borderColor: '#36A2EB',
      backgroundColor: 'rgba(54, 162, 235, 0.1)',
      fill: true,
      tension: 0.4
    }]
  };
}

function getCarbonCategory(emissions: number): string {
  if (emissions < 2000) return 'Climate Hero';
  if (emissions < 4000) return 'Low Impact';
  if (emissions < 8000) return 'Average';
  if (emissions < 12000) return 'High Impact';
  return 'Very High Impact';
}