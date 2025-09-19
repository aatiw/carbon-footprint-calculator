import { BaseAgent } from './BaseAgents';

export interface Recommendation {
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
}

export interface Scenario {
  name: string;
  description: string;
  timeframe: string;
  newTotal: number;
  reduction: number;
  reductionPercent: number;
  actions: string[];
  feasibility: number;
  cost: 'free' | 'low' | 'medium' | 'high';
}

export class RecommendationAgent extends BaseAgent {
  constructor() {
    super('Carbon Recommendation Agent', 'gemini-2.5-flash-lite');
  }

  protected getAgentRole(): string {
    return `Generate personalized, actionable carbon reduction recommendations.
      - Create specific, measurable actions based on user's lifestyle
      - Prioritize by impact, difficulty, and feasibility
      - Consider user constraints (budget, location, household)
      - Provide realistic timelines and implementation steps`;
  }

  async generateRecommendations(
    footprintData: any,
    userData: any,
    analysis: any
  ): Promise<Recommendation[]> {
    const prompt = `Generate personalized carbon reduction recommendations:

    User's Carbon Footprint:
    ${JSON.stringify(footprintData, null, 2)}

    User Profile:
    ${JSON.stringify(userData, null, 2)}

    Analysis Results:
    ${JSON.stringify(analysis, null, 2)}

    Create specific, actionable recommendations considering:
      - User's highest emission categories
      - Current lifestyle and constraints
      - Location and available options
      - Budget considerations
      - Household size and composition

    For each recommendation, calculate realistic CO2 reduction potential.

    Return JSON array of recommendations:
    [
      {
        "id": "unique_id",
        "category": "transportation|energy|food|water|shopping",
        "action": "short action title",
        "description": "3-4 line explanation of the action",
        "impact": {
          "co2Reduction": number, // kg CO2e per year
          "percentage": number, // % of total footprint
          "timeframe": "immediate|weeks|months|yearly"
        },
        "difficulty": "easy|medium|hard",
        "cost": "free|low|medium|high",
        "priority": number, // 1-10, 10 being highest priority
        "steps": ["Step 1", "Step 2", "Step 3"], //only 3 steps
        "benefits": ["Benefit 1", "Benefit 2"], // only 2
        "considerations": ["Thing to consider", "Potential challenge"]
      }
    ]

    Prioritize by impact and feasibility. Limit to 8 recommendations.`;

    const response = await this.generateResponse(prompt);
    const result = this.parseJSONResponse(response);

    return this.validateRecommendations(result);
  }

  async generateSeasonalRecommendations(
    footprintData: any,
    userData: any,
    season: 'spring' | 'summer' | 'fall' | 'winter'
  ): Promise<Recommendation[]> {
    const prompt = `Generate season-specific carbon reduction recommendations for ${season}:

    User's footprint: ${JSON.stringify(footprintData, null, 2)}
    User profile: ${JSON.stringify(userData, null, 2)}

    Consider seasonal factors:
    - Weather patterns and energy usage
    - Seasonal food availability
    - Transportation patterns
    - Seasonal activities and behaviors

    Generate 4-5 recommendations specifically relevant to ${season}.

    Return JSON array:
    [
      {
        "name": "Title",
        "description": "explanation based on season (3-4 line)",
        "seasonSuitableFor": "fall",
        "newTotal": number, // kg CO2e after changes
        "reduction": number, // kg CO2e reduced
        "reductionPercent": number, // percentage reduction
        "actions": ["Action 1", "Action 2"],
      }
    ]`;

    const response = await this.generateResponse(prompt);
    const result = this.parseJSONResponse(response);

    return this.validateRecommendations(result);
  }

  private validateRecommendations(recommendations: any[]): Recommendation[] {
    if (!Array.isArray(recommendations)) return [];

    return recommendations
      .filter(rec => 
        rec.id &&
        rec.category &&
        rec.action &&
        rec.description &&
        rec.impact?.co2Reduction &&
        typeof rec.impact.co2Reduction === 'number' &&
        rec.impact.co2Reduction >= 0 &&
        ['easy', 'medium', 'hard'].includes(rec.difficulty) &&
        ['free', 'low', 'medium', 'high'].includes(rec.cost) &&
        Array.isArray(rec.steps)
      )
      .slice(0, 15)
      .sort((a, b) => (b.priority || 0) - (a.priority || 0));
  }
}