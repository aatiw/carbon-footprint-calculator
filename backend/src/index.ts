import express, {type Express,type Request, type Response, type NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
dotenv.config({debug: false});
import compression from 'compression';
import dotenv from 'dotenv';
import { connectDB } from './config/database.js';

import questionnaireRoutes from './routes/questionnaire.routes';
import analysisRoutes from './routes/analysis.routes';
import dashboardRoutes from './routes/dashboard.routes';


const app: Express = express();
const PORT = process.env.PORT || 5000;



app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

app.use(compression());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));




app.get('/api/health', (req: Request, res: Response,) => {
  res.json({
    status: 'ok',
    timeStamp: new Date().toString()
  });
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'inside root handler for carbon footprint analyser'
  });
});



app.use('/api/questionnaire', questionnaireRoutes);
app.use('/api/analysis', analysisRoutes);
app.use('/api/dashboard', dashboardRoutes);



app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  res.status(500).json({ error: err.message,
    message: "Error in app use handler in index.ts"
   });
});



const startServer = async (): Promise<void> => {
  try {
    await connectDB();
    
    app.listen(PORT, () => {
      console.log(`Server is running on port:${PORT}, time at ${new Date().toISOString()}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();