import express from 'express';
import { getSearchRecords } from './searchRecord.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';

const router = express.Router();

// GET /api/search-records?searchTerm=xyz&page=1&limit=10&sort=keyword&from=2024-01-01&to=2025-01-01
router.get(
    '/',
    auth(USER_ROLE.USER, USER_ROLE.ORGANIZER, USER_ROLE.ADMIN),
    getSearchRecords
);

export const searchRecord = router;
