import QueryBuilder from "../../builder/QueryBuilder";
import { IInspiration } from "./inspiration.interface";
import { Inspiration } from "./inspiration.model";


const createInspiration = async (payload: IInspiration) => {
  console.log({ payload })
  const result = await Inspiration.create(payload);
  console.log({ result })
  return result;
};


const getAllInspirations = async (query: Record<string, any>) => {
  const inspirationQuery = new QueryBuilder(
    Inspiration.find({ isBlocked: false, isDeleted: false })
               .populate('author', 'name profileImage role')
               .populate('category', 'name description'),
    query
  )
    .search(['title', "description"]) // searchable fields
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
    Inspiration.find({ author: userId, isBlocked: false, isDeleted: false })
                   .populate('author', 'name profileImage role')
                   .populate('category', 'name description'),
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

    // Step 2: Lookup author info
    {
      $lookup: {
        from: 'users', // Assuming you have a 'users' collection
        localField: 'author',
        foreignField: '_id',
        as: 'authorInfo'
      }
    },
    {
      $unwind: '$authorInfo'
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
            author: {
              _id: '$authorInfo._id',
              name: '$authorInfo.name',
              profileImage: '$authorInfo.profileImage',
              role: '$authorInfo.role'
            },
            createdAt: '$createdAt',
            updatedAt: '$updatedAt'
          }
        },
        categoryCreatedAt: { $first: '$categoryInfo.createdAt' },
      }
    },

    // Step 3: Sort by category's createdAt field
    {
      $sort: {
        categoryCreatedAt: 1, // Sort categories by the createdAt field in ascending order
      },
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


const getAllInspirationsgroupBySubcategory = async () => {
  const data = await Inspiration.aggregate([
    // Step 1: Lookup category info
    {
      $lookup: {
        from: 'categories', // Assuming 'Categories' collection
        localField: 'category',
        foreignField: '_id',
        as: 'categoryInfo',
      },
    },
    {
      $unwind: '$categoryInfo',
    },

    // Step 2: Lookup author info
    {
      $lookup: {
        from: 'users', // Assuming 'users' collection
        localField: 'author',
        foreignField: '_id',
        as: 'authorInfo',
      },
    },
    {
      $unwind: '$authorInfo',
    },

    // Step 3: Group by subCategory
    {
      $group: {
        _id: '$subCategory', // Group by the subCategory field
        subCategoryName: { $first: '$subCategory' },
        inspirations: {
          $push: {
            _id: '$_id',
            title: '$title',
            type: '$type',
            description: '$description',
            coverImage: '$coverImage',
            imageGallery: '$imageGallery',
            category: {
              _id: '$categoryInfo._id',
              name: '$categoryInfo.name',
            },
            author: {
              _id: '$authorInfo._id',
              name: '$authorInfo.name',
              profileImage: '$authorInfo.profileImage',
              role: '$authorInfo.role',
            },
            createdAt: '$createdAt',
            updatedAt: '$updatedAt',
          },
        },
      },
    },

    // Step 4: Sort by subCategory and then newest (createdAt)
    {
      $sort: {
        subCategoryName: 1, // Sort by subCategory
        'inspirations.createdAt': -1, // Sort inspirations by createdAt (newest first)
      },
    },

    // Step 5: Project the final structure
    {
      $project: {
        _id: 0,
        subCategory: '$subCategoryName',
        inspirations: 1,
      },
    },
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
    Inspiration.find({ category: categoryId })
                  .populate('author', 'name profileImage role')
                  .populate('category', 'name description'),
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
  return await Inspiration.findById(id).populate('author', 'name profileImage role').populate('category', 'name');
};

const updateInspiration = async (id: string, payload: Partial<IInspiration>) => {

  const result = await Inspiration.findByIdAndUpdate(id, payload, { new: true });

  return result;
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
  getAllInspirationsgroupBySubcategory,
  getAllInspirationsGroupedByCategory
};
