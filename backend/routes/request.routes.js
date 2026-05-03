import { Router } from 'express';
import * as authMiddleware from '../middleware/auth.middleware.js';
import * as requestController from '../controllers/request.controller.js';

const router = Router();

router.use(authMiddleware.authUser);

router.post('/send', requestController.sendRequestController);
router.get('/pending', requestController.getPendingRequestsController);
router.post('/:requestId/accept', requestController.acceptRequestController);
router.post('/:requestId/reject', requestController.rejectRequestController);

export default router;
