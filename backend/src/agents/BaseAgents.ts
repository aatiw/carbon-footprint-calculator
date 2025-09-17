import { GoogleGenAI } from '@google/genai';

export abstract class BaseAgent {
  protected ai: GoogleGenAI;
  protected agentName: string;
  protected model: string;

  constructor(agentName: string, modelName: string = 'gemini-2.5-flash-lite') {
    if (!process.env.GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY environment variable is required');
    }

    this.ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
    this.agentName = agentName;
    this.model = modelName;
  }

  protected async generateResponse(prompt: string, context?: any): Promise<string> {
    try {
      const fullPrompt = this.buildPrompt(prompt, context);
      
      const contents = [
        {
          role: 'user' as const,
          parts: [
            {
              text: fullPrompt,
            },
          ],
        },
      ];

      const config = {
        thinkingConfig: {
          thinkingBudget: 0,
        },
      };

      const response = await this.ai.models.generateContentStream({
        model: this.model,
        config,
        contents,
      });

      let fullResponse = '';
      for await (const chunk of response) {
        if (chunk.text) {
          fullResponse += chunk.text;
        }
      }

      return fullResponse;
    } catch (error) {
      console.error(`Error in ${this.agentName}:`, error);
      throw new Error(`${this.agentName} failed to generate response`);
    }
  }

  protected buildPrompt(prompt: string, context?: any): string {
    let fullPrompt = `You are the ${this.agentName} for a carbon footprint calculator.
    Your role: ${this.getAgentRole()}

    Context: ${context ? JSON.stringify(context, null, 2) : 'None'}

    Task: ${prompt}

    Requirements:
    - Return valid JSON only
    - Be precise with calculations
    - Use latest emission factors when possible
    - Consider regional variations
    - Provide actionable insights

    Response:`;

    return fullPrompt;
  }

  protected abstract getAgentRole(): string;

  protected parseJSONResponse(response: string): any {
    try {
      const cleanResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^[^{]*({.*})[^}]*$/s, '$1')
        .trim();

      return JSON.parse(cleanResponse);
    } catch (error) {
      console.error(`JSON parsing error in ${this.agentName}:`, response);
      throw new Error(`Invalid JSON response from ${this.agentName}`);
    }
  }

  protected validateNumericResult(value: any, fieldName: string): number {
    const num = parseFloat(value);
    if (isNaN(num) || num < 0) {
      throw new Error(`Invalid ${fieldName}: ${value}`);
    }
    return num;
  }
}