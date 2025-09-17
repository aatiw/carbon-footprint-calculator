import { BaseAgent } from './BaseAgents';
import EmissionFactor from '../models/EmissionFactors';

export interface EmissionResult {
  total: number;
  breakdown: Record<string, number>;
}

export class CalculationAgent extends BaseAgent {
  constructor() {
    super('Carbon Calculation Agent', 'gemini-2.5-flash-lite');
  }

  protected getAgentRole(): string {
    return `Calculate and return precise carbon emissions based on user lifestyle data.
      - Apply appropriate emission factors present online
      - Handle regional variations
      - Account for usage patterns and frequencies`;
  }

  async calculateTransportationEmissions(
    transportData: any,
    region: string = 'global'
  ): Promise<EmissionResult> {    
    const prompt = `Calculate annual transportation emissions for:
      ${JSON.stringify(transportData, null, 2)}

      Return JSON with:
        {
          "total": number, // kg CO2e per year
          "breakdown": {
            "commute": number,
            "additionalTravel": number,
            "flights": number
          },
          "calculations": {
          "yearlyKm": number,
          "methodology": string
        }
      }`;

    const response = await this.generateResponse(prompt, { transportData });
    const result = this.parseJSONResponse(response);
    
    return {
      total: this.validateNumericResult(result.total, 'total emissions'),
      breakdown: result.breakdown
    };
  }

  async calculateHomeEnergyEmissions(
    energyData: any,
    region: string = 'global'
  ): Promise<EmissionResult> {
    
    const prompt = `Calculate annual home energy emissions for:
      ${JSON.stringify(energyData, null, 2)}

      Consider:
        - Electricity grid mix for region
        - Heating source efficiency
        - Appliance usage patterns
        - Renewable energy offset

      Return JSON with:
      {
        "total": number,
        "breakdown": {
          "electricity": number,
          "heating": number,
          "appliances": number
        },
        "calculations": {
        "yearlyKWh": number,
        "renewableOffset": number
        }
      }`;

    const response = await this.generateResponse(prompt, { energyData });
    const result = this.parseJSONResponse(response);
    
    return {
      total: this.validateNumericResult(result.total, 'total emissions'),
      breakdown: result.breakdown
    };
  }

  async calculateFoodEmissions(
    foodData: any,
    region: string = 'global'
  ): Promise<EmissionResult> {    
    const prompt = `Calculate annual food emissions for:
      ${JSON.stringify(foodData, null, 2)}

      Consider:
        - Diet type (omnivore, vegetarian, vegan)
        - Meat/dairy frequency
        - Food waste levels
        - Seasonal variations

      Return JSON with:
      {
        "total": number,
        "breakdown": {
          "meat": number,
          "dairy": number,
          "vegetables": number,
          "grains": number,
          "waste": number
        }
      }`;

    const response = await this.generateResponse(prompt, { foodData});
    const result = this.parseJSONResponse(response);
    
    return {
      total: this.validateNumericResult(result.total, 'total emissions'),
      breakdown: result.breakdown
    };
  }

  async calculateWaterEmissions(
    waterData: any,
    region: string = 'global'
  ): Promise<EmissionResult> {
    const prompt = `Calculate annual water-related emissions for:
    ${JSON.stringify(waterData, null, 2)}

    Consider:
      - Water treatment and delivery
      - Hot water heating (energy source)
      - Water-saving fixture efficiency
      - Regional water scarcity factors

    Return JSON with:
    {
      "total": number,
      "breakdown": {
        "treatment": number,
        "heating": number,
        "distribution": number
      }
    }`;

    const response = await this.generateResponse(prompt, { waterData});
    const result = this.parseJSONResponse(response);
    
    return {
      total: this.validateNumericResult(result.total, 'total emissions'),
      breakdown: result.breakdown
    };
  }

  async calculateShoppingEmissions(
    shoppingData: any,
    region: string = 'global'
  ): Promise<EmissionResult> {
    const prompt = `Calculate annual shopping/consumption emissions for:
    ${JSON.stringify(shoppingData, null, 2)}

    Consider:
    - Clothing purchase frequency and type
    - Electronics upgrade cycles
    - Packaging and shipping
    - Product lifecycles
    - Recycling rates

    Return JSON with:
    {
      "total": number,
      "breakdown": {
        "clothing": number,
        "electronics": number,
        "packaging": number,
        "other": number
      }
    }`;

    const response = await this.generateResponse(prompt, { shoppingData });
    const result = this.parseJSONResponse(response);
    
    return {
      total: this.validateNumericResult(result.total, 'total emissions'),
      breakdown: result.breakdown
    };
  }
}