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
            upload.fields([
                { name: 'image', maxCount: 1 },
                { name: 'gallery', maxCount: 10 },
                ]),
            parseData(),
            postCommunityController.createPost
        )

    .patch(
        "/block/:postCommunityId",
        auth(USER_ROLE.ADMIN, USER_ROLE.USER, USER_ROLE.ORGANIZER),
        postCommunityController.blockPostCommunity
    )

    .patch(
            '/:id', 
            auth(USER_ROLE.USER, USER_ROLE.ORGANIZER), 
            upload.fields([
                { name: 'image', maxCount: 1 },
                { name: 'gallery', maxCount: 10 },
                ]),
            parseData(),
            postCommunityController.updatePostCommunityById
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
        '/:postId',
        auth(USER_ROLE.USER),
        postCommunityController.deletePostCommunityById
    );

export const postCommunityRoutes = router;
