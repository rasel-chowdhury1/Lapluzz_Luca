import { Request, Response } from 'express';
import catchAsync from '../../utils/catchAsync';
import sendResponse from '../../utils/sendResponse';
import { checklistService } from './checklist.service';
import { uploadFileToS3 } from '../../utils/fileUploadS3';
import fs, { access } from 'fs';

// Controller to create a checklist
const createChecklist = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { checklistName } = req.body;

  let image = '';  // Default image URL

  if (req?.file) {
    // If there's a file uploaded, upload it to S3
    try {
      const data = await uploadFileToS3(req.file);  // Upload to S3 or any cloud storage
      console.log("Image uploaded to S3:", data);

      // Delete the file from the local server after successful upload
      fs.unlinkSync(req.file.path);

      image = data.Location;  // Get the image URL from S3 response
    } catch (error) {
      console.log("Error uploading file:", error);
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }
  }

  // Create the checklist with the image URL
  const result = await checklistService.createChecklist(userId, { checklistName, image });

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Checklist created successfully',
    data: result,
  });
});


// Controller to update a checklist
const updateChecklist = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;  // Extract userId from the request object
  const { checkListId } = req.params;  // Extract checklistId from the request params

  let imageUrl = '';  // Default value for image URL (in case no image is uploaded)

  if (req?.file) {
    // If there's a file uploaded, upload it to S3
    try {
      const data = await uploadFileToS3(req.file);  // Assuming you have this utility function for S3
      console.log("Image uploaded to S3:", data);

      // Delete the file from the local server after successful upload
      fs.unlinkSync(req.file.path);

      imageUrl = data.Location;  // Get the image URL from the S3 response
    } catch (error) {
      console.log("Error uploading file:", error);
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
    }
  }

  // If image is uploaded, include it in the body
  const updatedData = { ...req.body, image: imageUrl };

  // Call the service function to update the checklist
  const result = await checklistService.updateChecklist(userId, checkListId, updatedData);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Checklist updated successfully',
    data: result,
  });
});



// Controller to add an item to a checklist
const addItemToChecklist = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { checklistName, itemName } = req.body;

  const result = await checklistService.addItem(userId, checklistName, itemName);

  sendResponse(res, {
    statusCode: 201,
    success: true,
    message: 'Item added successfully to checklist',
    data: result,
  });
});

// Controller to update the `isChecked` status of an item (check/uncheck)
const updateItemStatus = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;



  const { checkListId, itemId, isChecked } = req.body;

  const result = await checklistService.updateItemStatus(
    userId,
    checkListId,
    itemId,
    isChecked
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Item status updated successfully',
    data: result,
  });
});


const updateChecklistItemName = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { checkListId, itemId, itemName } = req.body;

  const result = await checklistService.updateChecklistItemName(
    userId,
    checkListId,
    itemId,
    itemName
  );

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Item name updated successfully',
    data: result,
  });

})


const deleteChecklistItem = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { checkListId, itemId } = req.body;

  const result = await checklistService.deleteChecklistItem(userId, checkListId, itemId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Item deleted successfully',
    data: result,
  });
});

// Controller to get all checklists for the user
const getUserChecklists = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;

  const result = await checklistService.getChecklistsByUser(userId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Checklists fetched successfully',
    data: result,
  });
});

// Controller to get a specific checklist by name
const getChecklistByName = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { checklistName } = req.params;

  const result = await checklistService.getChecklistByName(userId, checklistName);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Checklist fetched successfully',
    data: result,
  });
});

// Controller to count how many items are checked in a checklist
const countCheckedItems = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user;
  const { checklistName } = req.params;

  const result = await checklistService.countCheckedItems(userId, checklistName);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Checked items count fetched successfully',
    data: { count: result },
  });
});

// Controller to delete a checklist (soft delete)
const deleteChecklist = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user; // Get the userId from the authenticated user
  const { checkListId } = req.params; // Get the checkListId from the request params

  // Call the service to soft delete the checklist
  const result = await checklistService.deleteChecklist(userId, checkListId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Checklist deleted successfully',
    data: result,
  });
});

// Optional: Controller for hard delete
const hardDeleteChecklist = catchAsync(async (req: Request, res: Response) => {
  const { userId } = req.user; // Get the userId from the authenticated user
  const { checkListId } = req.params; // Get the checkListId from the request params

  // Call the service to hard delete the checklist
  const result = await checklistService.hardDeleteChecklist(userId, checkListId);

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: 'Checklist permanently deleted',
    data: result,
  });
});


export const checklistController = {
  createChecklist,
  updateChecklist,
  addItemToChecklist,
  updateItemStatus,
  getUserChecklists,
  getChecklistByName,
  countCheckedItems,
  deleteChecklist,
  hardDeleteChecklist,
  updateChecklistItemName,
  deleteChecklistItem 
};
