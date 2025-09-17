import express, { Router } from 'express';
import {
  calculateFootprint,
  getFootprintDetails,
  generateRecommendations,
  createScenarios,
  compareWithBenchmarks
} from '../controllers/analysis.controller.js';

const router: Router = express.Router();

// Carbon footprint calculation
router.post('/calculate/:sessionId', calculateFootprint);
router.get('/footprint/:sessionId', getFootprintDetails);

// AI-powered analysis
router.post('/recommendations/:sessionId', generateRecommendations);
router.post('/scenarios/:sessionId', createScenarios);

// Comparisons
router.get('/benchmarks/:sessionId', compareWithBenchmarks);

export default router;
