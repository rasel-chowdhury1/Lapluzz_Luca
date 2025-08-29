import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { postCommunityService } from './postCommunity.service';
import { storeFile } from '../../utils/fileHelper';
import httpStatus from 'http-status';
import { uploadFileToS3 } from '../../utils/fileUploadS3';
import fs, { access } from 'fs';

const createPost = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  req.body.creator = userId;

  if (req?.file) {
      // req.body.profileImage = storeFile('profile', req?.file?.filename);
  
          // upload file in bucket function is done
      try {
        const data = await uploadFileToS3(req.file)
  
  
        console.log("data----->>>> ",data)
        // deleting file after upload
        fs.unlinkSync(req.file.path)
    
        req.body.image= data.Location;
      } catch (error) {
        console.log("====erro9r --->>> ", error)
        if(fs.existsSync(req.file.path)){
          fs.unlinkSync(req.file.path)
        }
      }
  
    }

  const result = await postCommunityService.createPost(req.body);
  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Post created successfully',
    data: result
  });
});

const updatePostCommunityById = catchAsync(
  async (req: Request, res: Response) => {
    const { id } = req.params; // Post ID
    const { userId } = req.user; // Logged-in user
    const updateData = req.body;

  if (req?.file) {
      // req.body.profileImage = storeFile('profile', req?.file?.filename);
  
          // upload file in bucket function is done
      try {
        const data = await uploadFileToS3(req.file)
  
  
        console.log("data----->>>> ",data)
        // deleting file after upload
        fs.unlinkSync(req.file.path)
    
        updateData.image= data.Location;
      } catch (error) {
        console.log("====erro9r --->>> ", error)
        if(fs.existsSync(req.file.path)){
          fs.unlinkSync(req.file.path)
        }
      }
  
    }


    const updatedPost = await postCommunityService.updatePostCommunityById(
      userId,
      id,
      updateData
    );

    return sendResponse(res, {
      statusCode: httpStatus.OK,
      success: true,
      message: 'PostCommunity updated successfully!',
      data: updatedPost,
    });
  }
);

const deletePostCommunityById = catchAsync(async (req: Request, res: Response) => {
  const { postId } = req.params;
  const { userId } = req.user;
  
  // Call service to delete post
  const result = await postCommunityService.deletePostCommunityById(userId, postId);

  // Respond with a meaningful message
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Post deleted successfully.',
    data: result
  });
});

const getAllPosts = catchAsync(async (req: Request, res: Response) => {
  const result = await postCommunityService.getAllPosts(req.query);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Posts fetched successfully',
    data: result
  });
});

const getPostById = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const result = await postCommunityService.getPostById(req.params.id, userId);
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Post fetched successfully',
    data: result
  });
});


// ✅ Get posts by current logged-in user
const getMyPosts = catchAsync(async (req: Request, res: Response) => {
  const userId = req.user.userId;

  const posts = await postCommunityService.getMyPosts(userId);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'My posts retrieved successfully',
    data: posts,
  });
});

// ✅ Get latest posts with total likes/comments
const getLatestPosts = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;

  console.log({userId})
  const limit = parseInt(req.query.limit as string) || 10;


  const posts = await postCommunityService.getLatestPosts(userId, limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Latest posts retrieved successfully',
    data: posts,
  });
});

// ✅ Get latest posts with total likes/comments
const getSpecificCategoryOrRegionPosts = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;

  console.log({userId})
  const limit = parseInt(req.query.limit as string) || 10;

  const filters: { category?: string; region?: string } = {};
  if (req.query.category) filters.category = req.query.category as string;
  if (req.query.region) filters.region = req.query.region as string;

  const posts = await postCommunityService.getSpecificCategoryOrRegionPosts(userId, limit, filters);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Specific category or region posts retrieved successfully',
    data: posts,
  });
});

// ✅ Get most viewed posts with by likes total likes/comments
const getMostViewedPosts = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;

  console.log({userId})
  const limit = parseInt(req.query.limit as string) || 10;

  const posts = await postCommunityService.getMostViewedPosts(userId, limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Most viewed posts retrieved successfully',
    data: posts,
  });
});

// ✅ Get most viewed posts with by likes total likes/comments
const getMostCommentedPosts = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;

  console.log({userId})
  const limit = parseInt(req.query.limit as string) || 10;

  const posts = await postCommunityService.getMostCommentedPosts(userId, limit);

  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: 'Most comment posts retrieved successfully',
    data: posts,
  });
});

export const postCommunityController = {
  createPost,
  updatePostCommunityById,
  getAllPosts,
  getPostById,
  getMyPosts,
  getLatestPosts,
  getMostViewedPosts,
  getMostCommentedPosts,
  getSpecificCategoryOrRegionPosts,
  deletePostCommunityById
};
