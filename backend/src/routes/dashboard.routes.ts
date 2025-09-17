import express, { Router } from 'express';
import {
  getDashboardData,
  getChartData,
  exportReport,
  getReductionPotential,
  simulateScenario
} from '../controllers/dashboard.controller';

const router: Router = express.Router();

// Dashboard data
router.get('/data/:sessionId', getDashboardData);
router.get('/charts/:sessionId/:chartType', getChartData);

// Reports and exports
router.get('/export/:sessionId', exportReport);

// Interactive features
router.get('/reduction-potential/:sessionId', getReductionPotential);
router.post('/simulate', simulateScenario);

export default router;