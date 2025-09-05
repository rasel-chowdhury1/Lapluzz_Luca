import { Router } from 'express';
import { reportController } from './report.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';

const router = Router();

router
    .post(
        '/',
        auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
        reportController.createReport
    )

    .post(
        "/sentNotification",
        auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
        
    )

    .get(
        '/',
        auth('admin'),
        reportController.getAllReports
    )
    
    .get(
        '/:id',
        auth('admin'),
        reportController.getReportById
    )

    .put(
        '/complete/:id',  // New route to mark a report as completed
        auth('admin'),
        reportController.markAsCompleted
    )

    .delete(
        '/:id',
        auth('admin'),
        reportController.deleteReport
    );

export const ReportRoutes = router;

