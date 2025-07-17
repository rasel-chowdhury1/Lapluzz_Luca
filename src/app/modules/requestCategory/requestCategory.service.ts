import RequestedCategory from "./requestCategory.model";


const createRequestedCategory = async (payload: any) => {
  return await RequestedCategory.create(payload);
};

const getAllRequestedCategories = async (filter: any = {}) => {
  return await RequestedCategory.find({ ...filter, isDeleted: false }).populate('user', 'name');
};

const getRequestedCategoryById = async (id: string) => {
  return await RequestedCategory.findOne({ _id: id, isDeleted: false }).populate('user');
};

// Soft delete
const deleteRequestedCategory = async (id: string) => {
  return await RequestedCategory.findByIdAndUpdate(id, { isDeleted: true }, { new: true });
};

export const RequestedCategoryService = {
  createRequestedCategory,
  getAllRequestedCategories,
  getRequestedCategoryById,
  deleteRequestedCategory,
};
