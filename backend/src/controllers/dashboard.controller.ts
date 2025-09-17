import type { Request, Response, NextFunction } from 'express';
import User from '../models/User';
import CarbonFootprint from '../models/CarbonFootPrint.js';
import type { ApiResponse } from '../types';


export const getDashboardData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    
    // Fetch user and latest footprint data
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
    
    // Calculate additional insights
    const insights = generateDashboardInsights(footprint, user);
    const goals = calculateGoalProgress(footprint);
    const trends = await calculateTrends(sessionId!);
    
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
      scenarios: footprint.scenarios || [],
      insights,
      goals,
      trends
    };
    
    const response: ApiResponse = {
      success: true,
      data: dashboardData,
      message: 'Dashboard data retrieved successfully',
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Get chart data for specific chart type
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
    
    let chartData;
    
    switch (chartType) {
      case 'pie':
        chartData = generatePieChartData(footprint);
        break;
      case 'bar':
        chartData = generateBarChartData(footprint);
        break;
      case 'waterfall':
        chartData = generateWaterfallChartData(footprint);
        break;
      case 'comparison':
        chartData = generateComparisonChartData(footprint);
        break;
      case 'trends':
        chartData = await generateTrendsChartData(sessionId!);
        break;
      case 'scenarios':
        chartData = generateScenariosChartData(footprint);
        break;
      default:
        res.status(400).json({
          success: false,
          error: 'Invalid chart type',
          timestamp: new Date().toISOString()
        });
        return;
    }
    
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

// Export dashboard report
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
      scenarios: footprint.scenarios || []
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
    next(error);
  }
};

// Get reduction potential analysis
export const getReductionPotential = async (
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
    
    const reductionPotential = calculateReductionPotential(footprint);
    
    const response: ApiResponse = {
      success: true,
      data: reductionPotential,
      message: 'Reduction potential calculated successfully',
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Simulate custom scenario
export const simulateScenario = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId, changes } = req.body;
    
    if (!sessionId || !changes) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
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
    
    // Apply changes to simulate new footprint
    const simulatedFootprint = applyScenarioChanges(footprint, changes);
    const reduction = footprint.totalEmissions - simulatedFootprint.totalEmissions;
    const reductionPercent = (reduction / footprint.totalEmissions) * 100;
    
    const simulation = {
      original: footprint.totalEmissions,
      simulated: simulatedFootprint.totalEmissions,
      reduction,
      reductionPercent: Math.round(reductionPercent),
      changes,
      newCategory: getCarbonCategory(simulatedFootprint.totalEmissions),
      breakdown: Object.entries(simulatedFootprint.emissions).map(([name, data]: [string, any]) => ({
        category: name,
        original: footprint.emissions[name].total,
        simulated: data.total,
        change: footprint.emissions[name].total - data.total
      }))
    };
    
    const response: ApiResponse = {
      success: true,
      data: simulation,
      message: 'Scenario simulated successfully',
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
};

// Helper functions
function generateDashboardInsights(footprint: any, user: any): any {
  const insights = [];
  
  // Highest category insight
  const categories = Object.entries(footprint.emissions);
  const highest = categories.reduce((max, [name, data]: [string, any]) => 
    data.total > max.value ? { name, value: data.total } : max, 
    { name: '', value: 0 }
  );
  
  insights.push({
    type: 'highest_category',
    title: `${highest.name} is your largest contributor`,
    description: `Accounting for ${Math.round((highest.value / footprint.totalEmissions) * 100)}% of your footprint`,
    value: highest.value,
    category: highest.name
  });
  
  // Comparison insight
  const comparison = footprint.comparisons;
  if (footprint.totalEmissions < comparison.globalTarget) {
    insights.push({
      type: 'below_target',
      title: 'You\'re below the global target!',
      description: `Your footprint is ${Math.round(((comparison.globalTarget - footprint.totalEmissions) / comparison.globalTarget) * 100)}% below the 2-ton target`,
      value: comparison.globalTarget - footprint.totalEmissions
    });
  } else {
    insights.push({
      type: 'above_target',
      title: 'Room for improvement',
      description: `You're ${Math.round(((footprint.totalEmissions - comparison.globalTarget) / comparison.globalTarget) * 100)}% above the global target`,
      value: footprint.totalEmissions - comparison.globalTarget
    });
  }
  
  // Household size insight
  const perPersonEmissions = footprint.totalEmissions / (user.householdSize || 1);
  insights.push({
    type: 'per_person',
    title: 'Per person footprint',
    description: `${Math.round(perPersonEmissions)} kg CO₂e per person in your household`,
    value: perPersonEmissions
  });
  
  return insights;
}

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

async function calculateTrends(sessionId: string): Promise<any> {
  // Get historical footprints for trends (if any)
  const footprints = await CarbonFootprint.find({ sessionId })
    .sort({ calculatedAt: -1 })
    .limit(12); // Last 12 calculations
  
  if (footprints.length < 2) {
    return {
      available: false,
      message: 'Not enough data for trends'
    };
  }
}

function generatePieChartData(footprint: any): any {
  return {
    labels: Object.keys(footprint.emissions),
    datasets: [{
      data: Object.values(footprint.emissions).map((category: any) => category.total),
      backgroundColor: [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
      ],
      borderWidth: 2
    }]
  };
}

function generateBarChartData(footprint: any): any {
  return {
    labels: Object.keys(footprint.emissions),
    datasets: [{
      label: 'Emissions (kg CO₂e)',
      data: Object.values(footprint.emissions).map((category: any) => category.total),
      backgroundColor: '#36A2EB',
      borderColor: '#1E88E5',
      borderWidth: 1
    }]
  };
}

function generateWaterfallChartData(footprint: any): any {
  const categories = Object.entries(footprint.emissions);
  return {
    labels: [...categories.map(([name]) => name), 'Total'],
    datasets: [{
      label: 'Cumulative Emissions',
      data: categories.reduce((acc: number[], [, data]: [string, any], index) => {
        const prev = index === 0 ? 0 : acc[index - 1];
        acc.push(prev + data.total);
        return acc;
      }, []).concat([footprint.totalEmissions]),
      backgroundColor: '#4BC0C0'
    }]
  };
}

function generateComparisonChartData(footprint: any): any {
  return {
    labels: ['Your Footprint', 'Local Average', 'National Average', 'Global Target'],
    datasets: [{
      label: 'Emissions (kg CO₂e)',
      data: [
        footprint.totalEmissions,
        footprint.comparisons.localAverage,
        footprint.comparisons.nationalAverage,
        footprint.comparisons.globalTarget
      ],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
      borderWidth: 1
    }]
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

function generateScenariosChartData(footprint: any): any {
  if (!footprint.scenarios || footprint.scenarios.length === 0) {
    return { message: 'No scenarios available' };
  }
  
  const scenarios = footprint.scenarios;
  return {
    labels: ['Current', ...scenarios.map((s: any) => s.name)],
    datasets: [{
      label: 'Emissions (kg CO₂e)',
      data: [footprint.totalEmissions, ...scenarios.map((s: any) => s.newTotal)],
      backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0'],
      borderWidth: 1
    }]
  };
}

function calculateReductionPotential(footprint: any): any {
  const categories = Object.entries(footprint.emissions);
  
  return categories.map(([name, data]: [string, any]) => {
    let maxReduction = 0;
    let actions = [];
    
    switch (name) {
      case 'transportation':
        maxReduction = data.total * 0.8; // 80% reduction possible
        actions = ['Switch to electric vehicle', 'Use public transport', 'Work from home'];
        break;
      case 'homeEnergy':
        maxReduction = data.total * 0.7; // 70% reduction possible
        actions = ['Switch to renewable energy', 'Improve insulation', 'Energy-efficient appliances'];
        break;
      case 'food':
        maxReduction = data.total * 0.6; // 60% reduction possible
        actions = ['Plant-based diet', 'Reduce food waste', 'Local sourcing'];
        break;
      case 'water':
        maxReduction = data.total * 0.5; // 50% reduction possible
        actions = ['Shorter showers', 'Water-efficient fixtures', 'Reduce hot water use'];
        break;
      case 'shopping':
        maxReduction = data.total * 0.7; // 70% reduction possible
        actions = ['Buy less', 'Choose durable goods', 'Repair instead of replace'];
        break;
      default:
        maxReduction = data.total * 0.3;
        actions = ['General reduction measures'];
    }
    
    return {
      category: name,
      current: data.total,
      maxReduction,
      potential: Math.round(((maxReduction / data.total) * 100)),
      actions
    };
  });
}

function applyScenarioChanges(footprint: any, changes: any): any {
  const newFootprint = JSON.parse(JSON.stringify(footprint));
  
  Object.entries(changes).forEach(([category, reduction]: [string, any]) => {
    if (newFootprint.emissions[category]) {
      const reductionAmount = typeof reduction === 'number' 
        ? reduction 
        : newFootprint.emissions[category].total * (reduction.percentage / 100);
      
      newFootprint.emissions[category].total = Math.max(
        0, 
        newFootprint.emissions[category].total - reductionAmount
      );
    }
  });
  
  newFootprint.totalEmissions = Object.values(newFootprint.emissions)
    .reduce((sum: number, category: any) => sum + category.total, 0);
  
  return newFootprint;
}

function getCarbonCategory(emissions: number): string {
  if (emissions < 2000) return 'Climate Hero';
  if (emissions < 4000) return 'Low Impact';
  if (emissions < 8000) return 'Average';
  if (emissions < 12000) return 'High Impact';
  return 'Very High Impact';
}