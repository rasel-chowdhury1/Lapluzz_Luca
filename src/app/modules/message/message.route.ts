import { Router } from 'express';
import { messageController } from './message.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';

export const messageRoutes = Router();

messageRoutes
  .post(
    '/send', 
    auth('user', 'admin'), 
    messageController.sendMessage
)
  
  .post(
    "/file-upload", 
    auth(USER_ROLE.USER,USER_ROLE.ORGANIZER,USER_ROLE.SUPER_ADMIN,USER_ROLE.ADMIN),
  )
  .patch(
    '/update/:msgId', 
    auth('user', 'admin'),
    messageController.updateMessage
  )

.patch(
    '/seen/:chatId',
    auth(
      'user',
      'admin'
    ),
    messageController.seenMessage,
  )

  .delete(
    '/delete/:msgId', 
    auth('user', 'admin'),
    messageController.deleteMessage
  )

  .get(
    '/:chatId', 
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    messageController.getMessagesForChat
  );

