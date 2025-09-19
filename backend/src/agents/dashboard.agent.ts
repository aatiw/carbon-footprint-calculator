import { BaseAgent } from './BaseAgents.js';

export interface DashboardInsight {
  type: 'summary' | 'comparison' | 'trend' | 'achievement' | 'alert';
  title: string;
  description: string;
  value?: number;
  change?: number;
  icon?: string;
  color?: string;
}

export interface ChartConfig {
  type: 'pie' | 'bar' | 'line' | 'waterfall' | 'gauge';
  data: any;
  options: any;
  insights?: string[];
}

export class DashboardAgent extends BaseAgent {
  constructor() {
    super('Carbon Dashboard Agent', 'gemini-2.5-flash-lite');
  }

  protected getAgentRole(): string {
    return `Generate dashboard visualizations and insights for carbon footprint data.
      - Create meaningful charts and visual representations
      - Generate dashboard insights and summaries
      - Optimize data presentation for user understanding
      - Provide contextual explanations for visualizations`;
  }

  async generateDashboardInsights(
    footprintData: any,
    userData: any,
    benchmarks: any,
  ): Promise<DashboardInsight[]> {
    const prompt = `Generate key dashboard insights for this carbon footprint:

    Current Footprint:
    ${JSON.stringify(footprintData, null, 2)}

    User Profile:
    ${JSON.stringify(userData, null, 2)}

    Benchmarks:
    ${JSON.stringify(benchmarks, null, 2)}

    Generate 5-8 dashboard insights covering:
      - Total footprint summary
      - Biggest contributors
      - Progress vs goals
      - Comparisons to averages
      - Notable achievements or alerts

    Return JSON array:
    [
      {
        "type": "summary|comparison|trend|achievement|alert",
        "title": "Short, impactful title",
        "description": "Clear, actionable description",
        "value": number, // optional main metric
        "change": number, // optional change value
        "icon": "icon-name", // optional icon suggestion
        "color": "green|yellow|red|blue|gray" // optional color coding
      }
    ]`;

    const response = await this.generateResponse(prompt);
    const result = this.parseJSONResponse(response);

    return Array.isArray(result) ? result.slice(0, 8) : [];
  }

  async generateChartConfigs(
    footprintData: any,
    chartType: string
  ): Promise<ChartConfig> {
    const prompt = `Generate ${chartType} chart configuration for this carbon footprint data:

    Data:
    ${JSON.stringify(footprintData, null, 2)}

    Chart Type: ${chartType}

    Create optimized chart configuration including:
      - Properly formatted data
      - Appropriate styling and colors
      - Meaningful labels
      - Accessibility considerations
      - Insights about what the chart shows

    Return JSON:
    {
      "type": "${chartType}",
      "data": {
        // Chart.js compatible data structure
        "labels": [],
        "datasets": []
      },
      "options": {
        // Chart.js compatible options
        "responsive": true,
        "plugins": {
          "title": { "display": true, "text": "Chart Title" },
          "legend": {},
          "tooltip": {}
        }
      },
      "insights": [
        "Key insight about what this chart reveals",
        "Another insight about the data patterns"
      ]
  }`;

    const response = await this.generateResponse(prompt);
    const result = this.parseJSONResponse(response);

    return result;
  }

  async generateActionPlan(
    footprintData: any,
    recommendations: any[],
    userGoals: any,
    timeframe: number
  ): Promise<{
    plan: any[];
    timeline: any[];
    expectedImpact: any;
  }> {
    const prompt = `Create a ${timeframe}-month action plan:

    Current Footprint:
    ${JSON.stringify(footprintData, null, 2)}

    Recommendations:
    ${JSON.stringify(recommendations, null, 2)}

    User Goals:
    ${JSON.stringify(userGoals, null, 2)}

    Create a structured action plan with:
      - Prioritized actions by month
      - Implementation timeline
      - Expected cumulative impact
      - Generate top-3 action plan only

    Return JSON:
    {
      "plan": [
        {
          "month": ${timeframe},
          "actions": [
            {
              "title": "Action title",
              "category": "transportation|energy|food|water|shopping",
              "effort": "low|medium|high",
              "steps": ["Step 1", "Step 2"]
            }
          ]
        }
      ],
      "timeline": [
        {
          "milestone": "Month 3: 15% reduction achieved",
          "actions": ["Action 1", "Action 2"]
        }
      ],
      "expectedImpact": {
        "totalReduction": number,
        "percentReduction": number,
        "monthlyProgress": [number, number, number], // cumulative reductions
        "confidence": "high|medium|low"
      }
    }`;

    const response = await this.generateResponse(prompt);
    const result = this.parseJSONResponse(response);

    return result;
  }
};