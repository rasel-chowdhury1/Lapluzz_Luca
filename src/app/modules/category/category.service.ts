/* eslint-disable @typescript-eslint/no-explicit-any */
import httpStatus from 'http-status';
import { ICategory } from './category.interface';
import AppError from '../../error/AppError';
import Category from './category.model';
import QueryBuilder from '../../builder/QueryBuilder';

const createCategory = async (payload: ICategory) => {
  const category = await Category.isExistByName(payload?.name);
  if (category && category?.isDeleted) {
    return await Category.findByIdAndUpdate(category?._id, payload, {
      new: true,
    });
  }

  const result = await Category.create(payload);
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create category');
  }
  return result;
};

const getAllCategories = async (query: Record<string, any>) => {
  const categoriesModel = new QueryBuilder(Category.find(), query)
    .search(['name', 'type'])
    .filter()
    .paginate()
    .sort()
    .fields();

  const data = await categoriesModel.modelQuery;
  const meta = await categoriesModel.countTotal();

  return {
    data: data,
    meta,
  };
};

const getDynamicCategories = async (categoryName: string, query: any) => {
     
   query.sort = 'createdAt'
    const categoriesModel = new QueryBuilder(Category.find({ type: categoryName, isDeleted: false }), query)
    .search(['name', 'type'])
    .filter()
    .paginate()
    .sort()
    .fields();

  const data = await categoriesModel.modelQuery;
  const meta = await categoriesModel.countTotal();

  return {
    data: data,
    meta,
  };
};

const getBusinessCategories = async (query: Record<string, any>) => {
  // ✅ Always sort by createdAt (newest first by default)
  query.sort = query.sort || "createdAt";

  // ✅ Build base query
  const baseQuery = Category.find({
    type: "Provider",
    subcategory: { $ne: "" }, // not empty string
    isDeleted: false,
  });

  // ✅ Apply QueryBuilder utilities
  const categoriesModel = new QueryBuilder(baseQuery, query)
    .search(["name", "type"])
    .filter()
    .paginate()
    .sort()
    .fields();

  const data = await categoriesModel.modelQuery.lean(); // lean() → faster
  const meta = await categoriesModel.countTotal();

  return { data, meta };
};

const getCategoryById = async (id: string) => {
  const result = await Category.findById(id);
  if (!result) {
    throw new Error('Category not found');
  }
  return result;
};

const updateCategory = async (id: string, payload: Partial<ICategory>) => {
  const result = await Category.findByIdAndUpdate(id, payload, { new: true });
  if (!result) {
    throw new Error('Failed to update category');
  }
  return result;
};

const deleteCategory = async (id: string) => {
  const result = await Category.findByIdAndUpdate(
    id,
    { isDeleted: true },
    { new: true },
  );
  if (!result) {
    throw new AppError(httpStatus?.BAD_REQUEST, 'Failed to delete category');
  }

  return result;
};

export const categoryService = {
  createCategory,
  getAllCategories,
  getBusinessCategories,
  getDynamicCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
};