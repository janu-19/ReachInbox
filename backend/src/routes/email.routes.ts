import { Router } from 'express';
import {
  scheduleEmails,
  getEmails,
  getScheduledEmails,
  getSentEmails,
  getEmailById,
  scheduleCampaignSchema,
} from '../controllers/email.controller.js';
import { requireAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = Router();

// Require authorization for all campaign scheduler requests
router.use(requireAuth);

router.post('/schedule', validate(scheduleCampaignSchema), scheduleEmails);
router.get('/', getEmails);
router.get('/scheduled', getScheduledEmails);
router.get('/sent', getSentEmails);
router.get('/:id', getEmailById);

export default router;
