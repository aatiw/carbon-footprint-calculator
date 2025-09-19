import { BaseAgent } from "./BaseAgents.js";

export interface FootprintAnalysis {
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

export class AnalysisAgent extends BaseAgent {
  constructor() {
    super("Carbon Analysis Agent", "gemini-2.5-flash-lite");
  }

  protected getAgentRole(): string {
    return `Analyze carbon footprint data to provide insights and identify improvement opportunities.
      - Identify emission hotspots and patterns
      - Compare against benchmarks (local, national, global targets)
      - Generate personalized insights based on user profile
      - Assess progress toward climate goals`;
  }

  async analyzeFootprint(
    footprintData: any,
    userData: any,
    benchmarks: any
  ): Promise<FootprintAnalysis> {
    const prompt = `Analyze this carbon footprint data and provide comprehensive insights:

    User Data:
      ${JSON.stringify(userData, null, 2)}

    Footprint Data:
      ${JSON.stringify(footprintData, null, 2)}

    Benchmarks:
      ${JSON.stringify(benchmarks, null, 2)}

    Provide detailed analysis covering:
      1. Key insights (highest categories, unusual patterns, Positive behaviors to reinforce, Hidden emission sources, Lifestyle-specific recommendations),(return only at max 6 insight)
      2. Emission hotspots (categories requiring attention, return at max 3)
      3. Benchmark comparisons (vs local/national/global targets)

    Return JSON:
    {
      "insights": [
        {
          "type": "highest_category|below_target|per_person|efficiency|behavior|etc",
          "title": "Short insight title",
          "description": "2-3 line to the point explanation",
          "value": number,
          "category": "optional category name",
          "priority": 1-5
        }
      ],
      "hotspots": [
        {
          "category": "transportation|energy|food|water|shopping",
          "percentage": number,
          "severity": "low|medium|high",
          "reason": "Why this is a hotspot (don't give big explanation)"
        }
      ],
      "comparisons": {
        "category": "Climate Hero|Low Impact|Average|High Impact|Very High Impact",
        "message": "Personalized comparison message",
        "percentile": number
      }
    }`;

    const response = await this.generateResponse(prompt);
    const result = this.parseJSONResponse(response);

    return {
      insights: this.validateInsights(result.insights),
      hotspots: this.validateHotspots(result.hotspots),
      comparisons: result.comparisons,
    };
  }

  async identifyReductionOpportunities(
    footprintData: any,
    userData: any
  ): Promise<
    Array<{
      category: string;
      currentEmissions: number;
      maxReduction: number;
      reductionPercent: number;
      difficulty: "easy" | "medium" | "hard";
      actions: string[];
      impact: "low" | "medium" | "high";
    }>
  > {
    const prompt = `Identify specific reduction opportunities based on this footprint:

    Footprint Data:
    ${JSON.stringify(footprintData, null, 2)}

    User Lifestyle:
    ${JSON.stringify(userData, null, 2)}

    For emission category that are high, identify:
      - Realistic reduction potential
      - Specific actionable steps
      - Implementation difficulty
      - Impact level
      - Give just 1-2 actions

    Consider user's current lifestyle, location, and constraints.

    Return JSON array:
    [
      {
        "category": "transportation",
        "currentEmissions": number,
        "maxReduction": number,
        "reductionPercent": number,
        "difficulty": "easy|medium|hard",
        "actions": ["Specific action 1", "Specific action 2"],
        "impact": "low|medium|high"
      }
    ]`;

    const response = await this.generateResponse(prompt);
    const result = this.parseJSONResponse(response);

    return Array.isArray(result) ? result : [];
  }

  private validateInsights(insights: any[]): any[] {
    if (!Array.isArray(insights)) return [];

    return insights
      .filter(
        (insight) =>
          insight.type &&
          insight.title &&
          insight.description &&
          typeof insight.priority === "number"
      )
      .slice(0, 7);
  }

  private validateHotspots(hotspots: any[]): any[] {
    if (!Array.isArray(hotspots)) return [];

    return hotspots.filter(
      (hotspot) =>
        hotspot.category &&
        typeof hotspot.percentage === "number" &&
        ["low", "medium", "high"].includes(hotspot.severity)
    );
  }
}
