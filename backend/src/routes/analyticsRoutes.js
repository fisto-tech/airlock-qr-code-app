import express from 'express';
import {
  getAnalytics,
  getScanStats,
  getDashboard
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/dashboard', getDashboard);
router.get('/:qrCodeId', getAnalytics);
router.get('/:qrCodeId/stats', getScanStats);

export default router;