import express, { Router } from 'express';
import {
  calculateFootprint,
  getFootprintDetails,
  generateRecommendations,
  createScenarios,
  compareWithBenchmarks
} from '../controllers/analysis.controller.js';

const router: Router = express.Router();


router.post('/calculate/:sessionId', calculateFootprint);
router.get('/footprint/:sessionId', getFootprintDetails);


router.post('/recommendations/:sessionId', generateRecommendations);
router.post('/scenarios/:sessionId', createScenarios);

router.get('/benchmarks/:sessionId', compareWithBenchmarks);

export default router;
