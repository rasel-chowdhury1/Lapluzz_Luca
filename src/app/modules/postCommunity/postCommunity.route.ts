import { Router } from 'express';
import { postCommunityController } from './postCommunity.controller';
import auth from '../../middleware/auth';
import { USER_ROLE } from '../user/user.constants';
import fileUpload from '../../middleware/fileUpload';
import parseData from '../../middleware/parseData';
const upload = fileUpload('./public/uploads/community');

const router = Router();

router
    .post(
            '/add', 
            auth(USER_ROLE.USER, USER_ROLE.ORGANIZER), 
            upload.single('image'),
            parseData(),
            postCommunityController.createPost
        )
    .get(
        '/',
        postCommunityController.getAllPosts
)
    
    .get(
        '/myPost',
        auth(USER_ROLE.USER, USER_ROLE.ORGANIZER),
        postCommunityController.getMyPosts
)
    
    .get(
        '/latest',
        auth(USER_ROLE.USER, USER_ROLE.ORGANIZER),
        postCommunityController.getLatestPosts
)
    .get(
        '/specific',
        auth(USER_ROLE.USER, USER_ROLE.ORGANIZER),
        postCommunityController.getSpecificCategoryOrRegionPosts
)
    
    .get(
        '/mostViewed',
        auth(USER_ROLE.USER, USER_ROLE.ORGANIZER),
        postCommunityController.getMostViewedPosts
)
    .get(
        '/mostComment',
        auth(USER_ROLE.USER, USER_ROLE.ORGANIZER),
        postCommunityController.getMostCommentedPosts
    )
    .get(
        '/:id',
        auth(USER_ROLE.USER, USER_ROLE.ORGANIZER),
        postCommunityController.getPostById
)
    
    .delete(
        '/:id',
        auth(USER_ROLE.USER),
        postCommunityController.deletePost
    );

export const postCommunityRoutes = router;
