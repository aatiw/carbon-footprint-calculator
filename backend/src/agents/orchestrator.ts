import { CalculationAgent, type EmissionResult } from './Calculation.agent.js';
import { AnalysisAgent, type FootprintAnalysis } from './Analysis.agent.js';
import { RecommendationAgent, type Recommendation} from './recommendation.agent.js';
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
        dashboardInsights
      };

    } catch (error) {
      console.error('Error in AgentOrchestrator:', error);
      throw new Error(`Failed to process footprint: ${error instanceof Error ? error.message : 'Unknown error'}`);
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