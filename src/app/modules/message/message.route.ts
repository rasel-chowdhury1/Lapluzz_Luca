import { Router } from 'express';
import { messageController } from './message.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';
import fileUpload from '../../middleware/fileUpload';
import parseData from '../../middleware/parseData';
const upload = fileUpload('./public/uploads/messages');
export const messageRoutes = Router();

messageRoutes
  .post(
    '/send', 
    auth('user', 'admin'), 
    messageController.sendMessage
)
  
  .post(
    "/file-upload", 
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.SUPER_ADMIN, USER_ROLE.ADMIN),
    upload.fields([
      { name: 'images', maxCount: 10 }
    ]),
    parseData(),
    messageController.fileUpload
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
    '/unread-count', 
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    messageController.getUnreadMessageCount
  )

  .get(
    '/:chatId', 
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    messageController.getMessagesForChat
  );

