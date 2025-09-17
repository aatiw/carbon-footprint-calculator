import express, { Router } from 'express';
import {
  getDashboardData,
  getChartData,
  exportReport,
  getReductionPotential,
  simulateScenario
} from '../controllers/dashboard.controller';

const router: Router = express.Router();


router.get('/data/:sessionId', getDashboardData);
router.get('/charts/:sessionId/:chartType', getChartData);


router.get('/export/:sessionId', exportReport);


router.get('/reduction-potential/:sessionId', getReductionPotential);
router.post('/simulate', simulateScenario);

export default router;