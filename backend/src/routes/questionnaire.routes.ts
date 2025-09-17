import express, { Router } from 'express';
import {
  createSession,
  saveQuestionnaireStep,
  getQuestionnaireProgress,
  submitQuestionnaire,
  getSessionData
} from '../controllers/questionnaire.controller.js';

const router: Router = express.Router();


router.post('/session/create', createSession);
router.get('/session/:sessionId', getSessionData);


router.post('/step', saveQuestionnaireStep);
router.get('/progress/:sessionId', getQuestionnaireProgress);


router.post('/submit', submitQuestionnaire);

export default router;