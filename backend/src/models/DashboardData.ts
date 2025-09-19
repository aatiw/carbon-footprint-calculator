import mongoose, { Schema, Document } from 'mongoose';

export interface IDashboardData extends Document {
  sessionId: string;
  footprintId: mongoose.Types.ObjectId;
  goals: {
    current: number;
    target: number;
    progress: number;
    remaining: number;
    achieved: boolean;
  };
  dashboardInsights: Array<{
    type: "summary" | "comparison" | "trend" | "achievement" | "alert";
    title: string;
    description: string;
    value?: number;
    change?: number;
    icon?: string;
    color?: "green" | "yellow" | "red" | "blue" | "gray";
  }>;
  chartType: {
    type: string;
    data: {
        labels: string[],
        datasets: string[]
    };
    options: {
        responsive: string,
        plugins: {
            title: object,
            legend: object,
            tooltip: object
        }
    };
    insights: string[]
  };
  createdAt: Date;
}

const DashboardDataSchema = new Schema<IDashboardData>({
  sessionId: { type: String, required: true, index: true },
  footprintId: { type: Schema.Types.ObjectId, ref: "CarbonFootprint", required: true },
  goals: {
    current: Number,
    target: Number,
    progress: Number,
    remaining: Number,
    achieved: Boolean,
  },
  dashboardInsights: [
    {
      type: String,
      title: String,
      description: String,
      value: Number,
      change: Number,
      icon: String,
      color: String,
    },
  ],
  chartType: {
    type: String,
    data: {
        labels: [String],
        datasets: [String],
    },
    options : {
        responsive: String,
        plugins: {
            title: Object,
            legend: Object,
            tooltip: Object
        }
    },
    insights: [String]
  },
  
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model<IDashboardData>("DashboardData", DashboardDataSchema);
