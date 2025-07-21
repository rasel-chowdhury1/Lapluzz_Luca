import QueryBuilder from "../../builder/QueryBuilder";
import { IInspiration } from "./inspiration.interface";
import { Inspiration } from "./inspiration.model";


const createInspiration = async (payload: IInspiration) => {
  console.log({payload})
  const result = await Inspiration.create(payload);
  console.log({result})
  return result;
};


const getAllInspirations = async (query: Record<string, any>) => {
  const inspirationQuery = new QueryBuilder(
    Inspiration.find({isBlocked: false, isDeleted: true}).populate('category', 'name description'),
    query
  )
    .search(['title']) // searchable fields
    .filter()
    .paginate()
    .sort()
    .fields();

  const data = await inspirationQuery.modelQuery;
  const meta = await inspirationQuery.countTotal();

  return {
    data,
    meta,
  };
};

const getMyInspirations = async (userId: string, query: Record<string, any>) => {
  const inspirationQuery = new QueryBuilder(
    Inspiration.find({author: userId, isBlocked: false, isDeleted: false}).populate('category', 'name description'),
    query
  )
    .search(['title']) // searchable fields
    .filter()
    .paginate()
    .sort()
    .fields();

  const data = await inspirationQuery.modelQuery;
  const meta = await inspirationQuery.countTotal();

  return {
    data,
    meta,
  };
};



const getAllInspirationsGroupedByCategory = async () => {
  const data = await Inspiration.aggregate([
    {
      $lookup: {
        from: 'categories',
        localField: 'category',
        foreignField: '_id',
        as: 'categoryInfo'
      }
    },
    {
      $unwind: '$categoryInfo'
    },
    {
      $group: {
        _id: '$category',
        categoryName: { $first: '$categoryInfo.name' },
        categoryDescription: { $first: '$categoryInfo.description' },
        inspirations: {
          $push: {
            _id: '$_id',
            title: '$title',
            type: '$type',
            description: '$description',
            coverImage: '$coverImage',
            imageGallery: '$imageGallery',
            createdAt: '$createdAt',
            updatedAt: '$updatedAt'
          }
        }
      }
    },
    {
      $project: {
        _id: 0,
        categoryId: '$_id',
        categoryName: 1,
        categoryDescription: 1,
        inspirations: 1
      }
    }
  ]);

  return { data };
};


const getSpecificCategoryInspiration = async (
  categoryId: string,
  query: Record<string, any>
) => {
  const filterQuery = {
    ...query,
    category: categoryId, // ensure proper MongoDB ObjectId
  };

  const inspirationQuery = new QueryBuilder(
    Inspiration.find({ category: categoryId }).populate('category', 'name'),
    filterQuery
  )
    .search(['title'])
    .filter()
    .paginate()
    .sort()
    .fields();

  const data = await inspirationQuery.modelQuery;
  const meta = await inspirationQuery.countTotal();

  return {
    data,
    meta,
  };
};

const getInspirationById = async (id: string) => {
  return await Inspiration.findById(id).populate('category', 'name');
};

const updateInspiration = async (id: string, payload: Partial<IInspiration>) => {
  return await Inspiration.findByIdAndUpdate(id, payload, { new: true });
};

const deleteInspiration = async (id: string) => {
  return await Inspiration.findByIdAndDelete(id);
};

export const InspirationService = {
  createInspiration,
  getMyInspirations,
  getAllInspirations,
  getSpecificCategoryInspiration,
  getInspirationById,
  updateInspiration,
  deleteInspiration,
  getAllInspirationsGroupedByCategory
};
