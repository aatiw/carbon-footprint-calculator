import { AgentOrchestrator } from '../agents/orchestrator.js';

interface FootprintOptions {
  includeRecommendations?: boolean;
  includeScenarios?: boolean;
  includeDashboard?: boolean;
}

export class AgentIntegrationService {
  private static instance: AgentIntegrationService;
  private orchestrator: AgentOrchestrator;

  private constructor() {
    this.orchestrator = new AgentOrchestrator();
  }

  static getInstance(): AgentIntegrationService {
    if (!AgentIntegrationService.instance) {
      AgentIntegrationService.instance = new AgentIntegrationService();
    }
    return AgentIntegrationService.instance;
  }
  
  async calculateFootprint(userData: any, benchmarks: any, options: FootprintOptions = {}) {
    try {
      const result = await this.orchestrator.processCompleteFootprint(
        userData,
        benchmarks,
        {
        includeRecommendations: options.includeRecommendations ?? false,
        includeDashboard: options.includeDashboard ?? false,
        }
      );

      
      return {
        totalEmissions: result.totalEmissions,
        categories: Object.entries(result.emissions).map(([name, data]) => ({
          name,
          value: data.total,
          percentage: (data.total / result.totalEmissions) * 100,
          subcategories: Object.entries(data.breakdown).map(([subName, subValue]) => ({
            name: subName,
            value: subValue as number
          }))
        })),
        dailyAverage: result.totalEmissions / 365,
        monthlyAverage: result.totalEmissions / 12,
        yearlyTotal: result.totalEmissions,
        analysis: result.analysis,
        recommendations: result.recommendations,
        dashboardInsights: result.dashboardInsights
      };
    } catch (error) {
      console.error('Agent integration error:', error);
      throw error;
    }
  }

  
  async generateRecommendations(footprintData: any, userData: any, analysis?: any) {
    try {
      const recommendationAgent = this.orchestrator.getRecommendationAgent();
      
      if (!analysis) {
        const analysisAgent = this.orchestrator.getAnalysisAgent();
        analysis = await analysisAgent.analyzeFootprint(footprintData, userData, {});
      }

      return await recommendationAgent.generateRecommendations(footprintData, userData, analysis);
    } catch (error) {
      console.error('Recommendation generation error:', error);
      return [];
    }
  }

  
  async generateDashboardInsights(footprintData: any, userData: any, benchmarks: any, historicalData?: any[]) {
    try {
      const dashboardAgent = this.orchestrator.getDashboardAgent();
      return await dashboardAgent.generateDashboardInsights(footprintData, userData, benchmarks);
    } catch (error) {
      console.error('Dashboard insights error:', error);
      return this.createFallbackInsights(footprintData, benchmarks);
    }
  }
  
  async calculateReductionPotential(footprintData: any, userData: any) {
    try {
      const analysisAgent = this.orchestrator.getAnalysisAgent();
      return await analysisAgent.identifyReductionOpportunities(footprintData, userData);
    } catch (error) {
      console.error('Reduction potential error:', error);
      return this.createFallbackReductionPotential(footprintData);
    }
  }
  
  async generateChartData(footprintData: any, chartType: string) {
    try {
      const dashboardAgent = this.orchestrator.getDashboardAgent();
      return await dashboardAgent.generateChartConfigs(footprintData, chartType);
    } catch (error) {
      console.error('Chart generation error:', error);
      return this.createFallbackChartData(footprintData, chartType);
    }
  }

  
  private createFallbackScenarios(totalEmissions: number) {
    return [
      {
        name: 'Quick Wins',
        description: 'Easy changes you can make today',
        timeframe: '0-3 months',
        newTotal: totalEmissions * 0.9,
        reduction: totalEmissions * 0.1,
        reductionPercent: 10,
        actions: ['Switch to LED bulbs', 'Reduce meat consumption by 1 day per week'],
        feasibility: 9,
        cost: 'free'
      },
      {
        name: 'Moderate Impact',
        description: 'Achievable changes over 6 months',
        timeframe: '3-6 months',
        newTotal: totalEmissions * 0.75,
        reduction: totalEmissions * 0.25,
        reductionPercent: 25,
        actions: ['Install smart thermostat', 'Carpool 2 days per week'],
        feasibility: 7,
        cost: 'medium'
      }
    ];
  }

  private createFallbackInsights(footprintData: any, benchmarks: any) {
    const totalEmissions = footprintData.totalEmissions;
    const globalTarget = 2000;

    return [
      {
        type: 'summary',
        title: 'Your Carbon Footprint',
        description: `${Math.round(totalEmissions)} kg CO₂e per year`,
        value: totalEmissions,
        color: totalEmissions > globalTarget ? 'red' : 'green'
      },
      {
        type: 'comparison',
        title: totalEmissions <= globalTarget ? 'Below Global Target' : 'Above Global Target',
        description: totalEmissions <= globalTarget 
          ? `You're ${Math.round(((globalTarget - totalEmissions) / globalTarget) * 100)}% below the 2-ton target`
          : `You're ${Math.round(((totalEmissions - globalTarget) / globalTarget) * 100)}% above the 2-ton target`,
        value: Math.abs(totalEmissions - globalTarget),
        color: totalEmissions <= globalTarget ? 'green' : 'yellow'
      }
    ];
  }

  private createFallbackReductionPotential(footprintData: any) {
    const categories = Object.entries(footprintData.emissions);
    
    return categories.map(([name, data]: [string, any]) => ({
      category: name,
      current: data.total,
      maxReduction: data.total * 0.5, 
      potential: 50,
      actions: [`Reduce ${name} emissions`, `Optimize ${name} usage`]
    }));
  }

  private createFallbackChartData(footprintData: any, chartType: string) {
    const categories = Object.entries(footprintData.emissions);
    
    switch (chartType) {
      case 'pie':
        return {
          type: 'pie',
          data: {
            labels: categories.map(([name]) => name),
            datasets: [{
              data: categories.map(([, data]: [string, any]) => data.total),
              backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF']
            }]
          },
          options: { responsive: true }
        };
      default:
        return { message: `Chart type ${chartType} not available` };
    }
  }
}