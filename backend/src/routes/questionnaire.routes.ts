import express, { Router } from 'express';
import {
  createSession,
  saveQuestionnaireStep,
  getQuestionnaireProgress,
  submitQuestionnaire,
  getSessionData
} from '../controllers/questionnaire.controller.js';

const router: Router = express.Router();

// Session management
router.post('/session/create', createSession);
router.get('/session/:sessionId', getSessionData);

// Questionnaire steps
router.post('/step', saveQuestionnaireStep);
router.get('/progress/:sessionId', getQuestionnaireProgress);

// Final submission
router.post('/submit', submitQuestionnaire);

export default router;