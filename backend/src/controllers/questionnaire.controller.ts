import { type Request, type Response, type NextFunction } from 'express';
import User from '../models/User';
import { type ApiResponse } from '../types';
import { v4 as uuidv4 } from 'uuid';



export const createSession = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const sessionId = uuidv4();
    
    const response: ApiResponse = {
      success: true,
      data: {
        sessionId,
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      },
      message: 'Session created successfully',
      timestamp: new Date().toISOString()
    };
    
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};


export const getSessionData = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    
    const user = await User.findOne({ sessionId });
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    const response: ApiResponse = {
      success: true,
      data: user,
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
};


export const saveQuestionnaireStep = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId, step, category, data } = req.body;
    
    // Validate required fields
    if (!sessionId || !step || !category || !data) {
      res.status(400).json({
        success: false,
        error: 'Missing required fields',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    
    let user = await User.findOne({ sessionId });
    
    if (!user) {
      user = new User({ sessionId });
    }
    
    
    switch (category) {
      case 'basic':
        user.location = data.location;
        user.householdSize = data.householdSize;
        break;
      case 'transportation':
        user.transportation = data;
        break;
      case 'homeEnergy':
        user.homeEnergy = data;
        break;
      case 'foodDiet':
        user.foodDiet = data;
        break;
      case 'waterUsage':
        user.waterUsage = data;
        break;
      case 'shopping':
        user.shopping = data;
        break;
      default:
        res.status(400).json({
          success: false,
          error: 'Invalid category',
          timestamp: new Date().toISOString()
        });
        return;
    }
    
    await user.save();
    
    const response: ApiResponse = {
      success: true,
      data: {
        sessionId,
        step,
        category,
        saved: true
      },
      message: 'Step saved successfully',
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
};


export const getQuestionnaireProgress = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId } = req.params;
    
    const user = await User.findOne({ sessionId });
    
    if (!user) {
      res.status(404).json({
        success: false,
        error: 'Session not found',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    
    const progress = {
      basic: !!(user.location && user.householdSize),
      transportation: !!user.transportation?.primaryMode,
      homeEnergy: !!user.homeEnergy?.homeType,
      foodDiet: !!user.foodDiet?.dietType,
      waterUsage: !!user.waterUsage?.showerDuration,
      shopping: !!user.shopping?.clothingFrequency,
    };
    
    const completedSteps = Object.values(progress).filter(Boolean).length;
    const totalSteps = Object.keys(progress).length;
    const percentageComplete = Math.round((completedSteps / totalSteps) * 100);
    
    const response: ApiResponse = {
      success: true,
      data: {
        sessionId,
        progress,
        completedSteps,
        totalSteps,
        percentageComplete,
        isComplete: completedSteps === totalSteps
      },
      timestamp: new Date().toISOString()
    };
    
    res.json(response);
  } catch (error) {
    next(error);
  }
};



export const submitQuestionnaire = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { sessionId, userData } = req.body;
    
    if (!sessionId || !userData) {
      res.status(400).json({
        success: false,
        error: 'Missing required data',
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    
    let user = await User.findOne({ sessionId });
    
    if (!user) {
      user = new User({ sessionId, ...userData });
    } else {
      Object.assign(user, userData);
    }
    
    await user.save();
    
    const response: ApiResponse = {
      success: true,
      data: {
        sessionId,
        userId: user._id,
        submitted: true,
        submittedAt: new Date()
      },
      message: 'Questionnaire submitted successfully',
      timestamp: new Date().toISOString()
    };
    
    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
};