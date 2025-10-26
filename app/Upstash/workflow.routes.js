import { Router } from 'express';
import { sendReminders } from '../controllers/workflow.controller.js';
import arcjetMiddleware from '../middleware/arcjet.middleware.js';

const workflowRouter = Router();
workflowRouter.post('/reminder', arcjetMiddleware, sendReminders);

export default workflowRouter;