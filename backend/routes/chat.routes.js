import { Router } from 'express';
import { body, param, query } from 'express-validator';
import * as authMiddleware from '../middleware/auth.middleware.js';
import {
  createChatController,
  deleteChatController,
  deleteMessageController,
  listChatsController,
  listMessagesController,
  sendChatMessageController,
} from '../controllers/chat.controller.js';
import { messageRateLimit, chatCreateRateLimit } from '../middleware/rate-limit.middleware.js';

const router = Router();

router.use(authMiddleware.authUser);

router.get('/', listChatsController);

router.post(
  '/',
  chatCreateRateLimit(),
  body('participantId')
    .isMongoId()
    .withMessage('Participant must be a valid user id'),
  createChatController,
);

router.get(
  '/:chatId/messages',
  param('chatId').isMongoId().withMessage('Chat must be a valid id'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 200 })
    .withMessage('Limit must be between 1 and 200')
    .toInt(),
  query('offset')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Offset must be a non-negative integer')
    .toInt(),
  listMessagesController,
);

router.post(
  '/:chatId/messages',
  messageRateLimit(),
  param('chatId').isMongoId().withMessage('Chat must be a valid id'),
  body('message')
    .isString()
    .trim()
    .escape()
    .isLength({ min: 1, max: 4000 })
    .withMessage('Message must be between 1 and 4000 characters'),
  body('clientMessageId')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 120 })
    .withMessage('Client message id is too long'),
  sendChatMessageController,
);

router.delete(
  '/:chatId/messages/:messageId',
  param('chatId').isMongoId().withMessage('Chat must be a valid id'),
  param('messageId').isMongoId().withMessage('Message must be a valid id'),
  deleteMessageController,
);

router.delete(
  '/:chatId',
  param('chatId').isMongoId().withMessage('Chat must be a valid id'),
  deleteChatController,
);

export default router;
