import express from 'express';
import { createTicket, getUserTickets, getAllTickets } from './ticketSupport.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';


const router = express.Router();

router
    .post(
    '/',
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    createTicket
    )
    
    .get(
        '/my-tickets',
        auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
        getUserTickets
    )
    .get(
        '/all',
        auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
        getAllTickets
    ); // restrict all-tickets route to admin

export const TicketSupportRoutes = router;
