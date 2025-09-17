// Request/Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

// Session Types
export interface SessionData {
  sessionId: string;
  createdAt: Date;
  lastActivity: Date;
  completed: boolean;
}

// Questionnaire Types
export interface QuestionnaireStep {
  step: number;
  category: string;
  data: any;
  completed: boolean;
}

// Carbon Calculation Types
export interface EmissionCategory {
  name: string;
  value: number;
  percentage: number;
  subcategories?: {
    name: string;
    value: number;
  }[];
}

export interface CarbonCalculationResult {
  totalEmissions: number;
  categories: EmissionCategory[];
  dailyAverage: number;
  monthlyAverage: number;
  yearlyTotal: number;
}

// Recommendation Types
export interface Recommendation {
  id: string;
  category: string;
  title: string;
  description: string;
  impact: {
    value: number;
    unit: string;
    percentage: number;
  };
  difficulty: 'easy' | 'medium' | 'hard';
  priority: 'high' | 'medium' | 'low';
  timeframe: string;
  tips: string[];
}

// Scenario Types
export interface Scenario {
  id: string;
  name: string;
  description: string;
  actions: string[];
  projectedReduction: {
    absolute: number;
    percentage: number;
  };
  newTotal: number;
  difficulty: string;
  timeToImplement: string;
}

// Dashboard Data Types
export interface DashboardData {
  footprint: CarbonCalculationResult;
  comparisons: {
    local: number;
    national: number;
    global: number;
    userPercentile: number;
  };
  recommendations: Recommendation[];
  scenarios: Scenario[];
  charts: {
    breakdown: ChartData;
    comparison: ChartData;
    trend: ChartData;
    impact: ChartData;
  };
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    backgroundColor?: string | string[];
    borderColor?: string | string[];
    borderWidth?: number;
  }[];
}

// AI Agent Types
export interface AgentInput {
  type: string;
  data: any;
  context?: any;
}

export interface AgentOutput {
  success: boolean;
  result: any;
  metadata?: {
    processingTime: number;
    model?: string;
    confidence?: number;
  };
  error?: string;
}

export interface AgentConfig {
  name: string;
  description: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

// Emission Factor Types
export interface EmissionFactorQuery {
  category: string;
  subcategory?: string;
  activity: string;
  region?: string;
  unit: string;
}

export interface EmissionFactorResult {
  factor: number;
  unit: string;
  source: string;
  year: number;
  confidence: 'high' | 'medium' | 'low';
}

// Benchmark Types
export interface Benchmark {
  type: 'local' | 'national' | 'global';
  value: number;
  year: number;
  source: string;
  description: string;
}

// Validation Types
export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}

// Analytics Types
export interface UserAnalytics {
  sessionId: string;
  completionTime: number;
  stepsCompleted: number;
  totalSteps: number;
  abandonedAt?: string;
  device: string;
  browser: string;
}

// Export all types as a namespace for easier imports
export namespace CarbonFootprintTypes {
  export type Response<T> = ApiResponse<T>;
  export type Pagination = PaginationParams;
  export type Session = SessionData;
  export type QuizStep = QuestionnaireStep;
  export type Calculation = CarbonCalculationResult;
  export type Category = EmissionCategory;
  export type Recommend = Recommendation;
  export type Scene = Scenario;
  export type Dashboard = DashboardData;
  export type Chart = ChartData;
  export type Agent = {
    Input: AgentInput;
    Output: AgentOutput;
    Config: AgentConfig;
  };
}