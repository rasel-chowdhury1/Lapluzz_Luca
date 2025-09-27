import Checklist from './checklist.model';

// Service to create checklist
const createChecklist = async (userId: string, payload : {checklistName: string, image: string}) => {

  const newChecklist = await Checklist.create({
    userId,
    checklistName: payload.checklistName, // Pass checklistName directly
    image: payload.image, // Pass image directly
  });

  return newChecklist;
};

// Service to update a checklist
const updateChecklist = async (userId: string, checkListId: string, payload: { updateChecklistName: string, image: string }) => {
  // Find the checklist by userId and checkListId
  const checklist = await Checklist.findOne({ userId, _id: checkListId });


  if (!checklist) {
    throw new Error('Checklist not found');
  }

  // Update checklist fields
  checklist.checklistName = payload.updateChecklistName || checklist.checklistName;  // If checklistName is provided, update it
  checklist.image = payload.image || checklist.image;  // If image URL is provided, update it

  // Save the updated checklist
  await checklist.save();

  return checklist;
};

// Service to add an item to checklist (user-specific)
const addItem = async (
  userId: string,
  checklistName: string,
  itemName: string
) => {
  const checklist = await Checklist.findOne({ userId, checklistName });

  if (!checklist) {
    throw new Error('Checklist not found');
  }

  checklist.items.push({ itemName, isChecked: false });
  await checklist.save();

  return checklist;
};

// Service to update item status (check/uncheck)
const updateItemStatus = async (
  userId: string,
  checkListId: string,
  itemId: string,
  isChecked: boolean
) => {
  // Find the checklist by userId and checkListId
  const checklist = await Checklist.findOne({ userId, _id: checkListId });

  if (!checklist) {
    throw new Error('Checklist not found');
  }

  // Find the item within the checklist's items array
  const item = checklist.items.id(itemId); // Access subdocument by its _id

  if (!item) {
    throw new Error('Item not found');
  }

  // Update the item's isChecked field
  item.isChecked = isChecked;

  // Save the checklist after the item update
  await checklist.save();

  return checklist; // Return the updated checklist
};

// Service to count the number of checked items
const countCheckedItems = async (userId: string, checklistName: string) => {
  const checklist = await Checklist.findOne({ userId, checklistName });

  if (!checklist) {
    throw new Error('Checklist not found');
  }

  const checkedItems = checklist.items.filter(item => item.isChecked);
  return checkedItems.length;
};

// Service to get all checklists for the user
const getChecklistsByUser = async (userId: string) => {
  const checklists = await Checklist.find({ userId, isDeleted: false});

    // Iterate over each checklist and calculate the total checked items
  const checklistsWithCheckedCount = checklists.map((checklist) => {
    // Count how many items have isChecked set to true
    const checkedItemsCount = checklist.items.filter(item => item.isChecked).length;

    // Return the checklist with an added field for the checkedItemsCount
    return {
      ...checklist.toObject(),
      checkedItemsCount, // Add the count of checked items
    };
  });

  return checklistsWithCheckedCount;
};

// Service to get a specific checklist by name
const getChecklistByName = async (userId: string, checklistName: string) => {
  const checklist = await Checklist.findOne({ userId, checklistName });

  return checklist;
};

// Service to delete (soft delete) a checklist
const deleteChecklist = async (userId: string, checkListId: string) => {
  // Find the checklist by userId and checkListId
  const checklist = await Checklist.findOne({ userId, _id: checkListId });

  if (!checklist) {
    throw new Error('Checklist not found');
  }

  // Soft delete: Set isDeleted to true
  checklist.isDeleted = true;

  // Save the updated checklist
  await checklist.save();

  return checklist;
};

// Optional: If you want to completely delete the checklist, you can use hard delete:
const hardDeleteChecklist = async (userId: string, checkListId: string) => {
  const checklist = await Checklist.findOneAndDelete({ userId, _id: checkListId });

  if (!checklist) {
    throw new Error('Checklist not found');
  }

  return checklist;
};


export const checklistService = {
  createChecklist,
  updateChecklist,
  addItem,
  updateItemStatus,
  countCheckedItems,
  getChecklistsByUser,
  getChecklistByName,
  deleteChecklist,
  hardDeleteChecklist
};
