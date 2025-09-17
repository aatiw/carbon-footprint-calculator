import { CalculationAgent, type EmissionResult } from './Calculation.agent.js';
import { AnalysisAgent, type FootprintAnalysis } from './Analysis.agent.js';
import { RecommendationAgent, type Recommendation, type Scenario } from './recommendation.agent.js';
import { DashboardAgent, type DashboardInsight } from './dashboard.agent.js';

export interface FullFootprintResult {
  totalEmissions: number;
  emissions: {
    transportation: EmissionResult;
    homeEnergy: EmissionResult;
    food: EmissionResult;
    water: EmissionResult;
    shopping: EmissionResult;
  };
  analysis: FootprintAnalysis;
  recommendations: Recommendation[];
  scenarios: Scenario[];
  dashboardInsights: DashboardInsight[];
}

export class AgentOrchestrator {
  private calculationAgent: CalculationAgent;
  private analysisAgent: AnalysisAgent;
  private recommendationAgent: RecommendationAgent;
  private dashboardAgent: DashboardAgent;

  constructor() {
    this.calculationAgent = new CalculationAgent();
    this.analysisAgent = new AnalysisAgent();
    this.recommendationAgent = new RecommendationAgent();
    this.dashboardAgent = new DashboardAgent();
  }

  async processCompleteFootprint(
    userData: any,
    benchmarks: any,
    options: {
      includeRecommendations?: boolean;
      includeScenarios?: boolean;
      includeDashboard?: boolean;
    } = {}
  ): Promise<FullFootprintResult> {
    try {
      const region = userData.location?.country || 'global';


      
      console.log('Starting emission calculations...');
      const [transportation, homeEnergy, food, water, shopping] = await Promise.all([
        this.calculationAgent.calculateTransportationEmissions(userData.transportation, region),
        this.calculationAgent.calculateHomeEnergyEmissions(userData.homeEnergy, region),
        this.calculationAgent.calculateFoodEmissions(userData.foodDiet, region),
        this.calculationAgent.calculateWaterEmissions(userData.waterUsage, region),
        this.calculationAgent.calculateShoppingEmissions(userData.shopping, region)
      ]);

      const emissions = { transportation, homeEnergy, food, water, shopping };
      const totalEmissions = Object.values(emissions).reduce((sum, category) => sum + category.total, 0);

      console.log('Emission calculations complete:', totalEmissions, 'kg CO2e/year');



      console.log('Starting footprint analysis...');
      const footprintData = { totalEmissions, emissions };
      const analysis = await this.analysisAgent.analyzeFootprint(footprintData, userData, benchmarks);

      console.log('Analysis complete');

      let recommendations: Recommendation[] = [];
      let scenarios: Scenario[] = [];
      let dashboardInsights: DashboardInsight[] = [];

      if (options.includeRecommendations !== false) {
        console.log('Generating recommendations...');
        recommendations = await this.recommendationAgent.generateRecommendations(
          footprintData,
          userData,
          analysis
        );
        console.log('Recommendations generated:', recommendations.length);
      }

      

      if (options.includeScenarios !== false && recommendations.length > 0) {
        console.log('Creating reduction scenarios...');
        scenarios = await this.recommendationAgent.createReductionScenarios(
          footprintData,
          userData,
          recommendations
        );
        console.log('Scenarios created:', scenarios.length);
      }
      



      if (options.includeDashboard !== false) {
        console.log('Generating dashboard insights...');
        dashboardInsights = await this.dashboardAgent.generateDashboardInsights(
          footprintData,
          userData,
          benchmarks
        );
        console.log('Dashboard insights generated:', dashboardInsights.length);
      }

      return {
        totalEmissions,
        emissions,
        analysis,
        recommendations,
        scenarios,
        dashboardInsights
      };

    } catch (error) {
      console.error('Error in AgentOrchestrator:', error);
      throw new Error(`Failed to process footprint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }




  async recalculateWithChanges(
    originalData: any,
    changes: any,
    userData: any
  ): Promise<{ original: number; modified: number; reduction: number; reductionPercent: number }> {
    try {
      console.log('Recalculating footprint with changes...');

      const modifiedUserData = this.applyChangesToUserData(userData, changes);
      
      const region = userData.location?.country || 'global';
      const affectedCategories = Object.keys(changes);
      const newEmissions = { ...originalData.emissions };



      for (const category of affectedCategories) {
        switch (category) {
          case 'transportation':
            newEmissions.transportation = await this.calculationAgent.calculateTransportationEmissions(
              modifiedUserData.transportation, region
            );
            break;
          case 'homeEnergy':
            newEmissions.homeEnergy = await this.calculationAgent.calculateHomeEnergyEmissions(
              modifiedUserData.homeEnergy, region
            );
            break;
          case 'food':
            newEmissions.food = await this.calculationAgent.calculateFoodEmissions(
              modifiedUserData.foodDiet, region
            );
            break;
          case 'water':
            newEmissions.water = await this.calculationAgent.calculateWaterEmissions(
              modifiedUserData.waterUsage, region
            );
            break;
          case 'shopping':
            newEmissions.shopping = await this.calculationAgent.calculateShoppingEmissions(
              modifiedUserData.shopping, region
            );
            break;
        }
      }

      const newTotal = Object.values(newEmissions).reduce((sum, category) => sum + (category as any).total, 0);
      const reduction = originalData.totalEmissions - (newTotal as number);
      const reductionPercent = (reduction / originalData.totalEmissions) * 100;

      console.log('Recalculation complete:', { original: originalData.totalEmissions, modified: newTotal, reduction });

      return {
        original: originalData.totalEmissions,
        // @ts-ignore
        modified: newTotal,
        reduction,
        reductionPercent
      };

    } catch (error) {
      console.error('Error in recalculation:', error);
      throw new Error(`Failed to recalculate footprint: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async generateDashboardData(
    footprintData: any,
    userData: any,
    benchmarks: any,
    chartType?: string
  ): Promise<any> {
    try {
      if (chartType) {
        return await this.dashboardAgent.generateChartConfigs(footprintData, chartType);
      } else {
        return await this.dashboardAgent.generateDashboardInsights(footprintData, userData, benchmarks);
      }
    } catch (error) {
      console.error('Error generating dashboard data:', error);
      throw new Error(`Failed to generate dashboard data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private applyChangesToUserData(userData: any, changes: any): any {
    const modified = JSON.parse(JSON.stringify(userData));

    Object.entries(changes).forEach(([category, categoryChanges]: [string, any]) => {
      if (modified[category]) {
        Object.entries(categoryChanges).forEach(([field, value]) => {
          if (modified[category][field] !== undefined) {
            modified[category][field] = value;
          }
        });
      }
    });

    return modified;
  }
  


  getCalculationAgent(): CalculationAgent {
    return this.calculationAgent;
  }

  getAnalysisAgent(): AnalysisAgent {
    return this.analysisAgent;
  }

  getRecommendationAgent(): RecommendationAgent {
    return this.recommendationAgent;
  }

  getDashboardAgent(): DashboardAgent {
    return this.dashboardAgent;
  }
}