import mongoose, { mongo } from "mongoose";
import QueryBuilder from "../../builder/QueryBuilder";
import { IInspiration } from "./inspiration.interface";
import { Inspiration } from "./inspiration.model";


const createInspiration = async (payload: IInspiration) => {
  console.log({ payload })
  const result = await Inspiration.create(payload);
  console.log({ result })
  return result;
};


const getAllInspirations = async (userId: string, query: Record<string, any>) => {
  const inspirationQuery = new QueryBuilder(
    Inspiration.find({ isBlocked: false, isDeleted: false, blockedUsers: { $ne: new mongoose.Types.ObjectId(userId) } })
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



const getAllInspirationsGroupedByCategory = async (userId: string) => {
  const data = await Inspiration.aggregate([
    // Step 1: Lookup category info
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

    // Step 3: Match only the desired categories
    {
      $match: {
        blockedUsers: { $ne: new mongoose.Types.ObjectId(userId) },
        'categoryInfo.name': {
          $in: [
            'Getting Started Ideas',
            'Seasonal Trends',
            'Real Events That Inspire',
            'Style & Mood'
          ]
        }
      }
    },

    // Step 4: Group by category and gather inspirations
    {
      $group: {
        _id: '$categoryInfo.name',  // Group by category name
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

    // Step 5: Sort by category's createdAt field
    {
      $sort: {
        categoryCreatedAt: 1, // Sort categories by the createdAt field in ascending order
      }
    },

    // Step 6: Project the final output
    {
      $project: {
        _id: 0,
        subCategory: '$_id',
        // categoryDescription: 1,
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
  userId: string,
  categoryId: string,
  query: Record<string, any>
) => {
  const filterQuery = {
    ...query,
    category: categoryId, // ensure proper MongoDB ObjectId
  };

  const inspirationQuery = new QueryBuilder(
    Inspiration.find({ category: categoryId, blockedUsers: { $ne: new mongoose.Types.ObjectId(userId) } })
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

const updateInspiration = async (id: string, updateData: Partial<IInspiration> & { deleteGallery?: string[] }) => {

  console.log("updateData ->>> ", { ...updateData });

  // Fetch the current business first
  const existingInspiration = await Inspiration.findById(id);
  if (!existingInspiration) {
    throw new Error("Business not found");
  }

  let newGallery = existingInspiration?.imageGallery || [];

  // Remove images if deleteGallery is provided
  if (updateData.deleteGallery && updateData.deleteGallery.length > 0) {
    newGallery = newGallery.filter(
      img => !updateData.deleteGallery!.includes(img)
    );
  }

  // Append new images if provided
  if (updateData.imageGallery && updateData.imageGallery.length > 0) {
    newGallery = [...newGallery, ...updateData.imageGallery];
  }

  // Update the gallery in updateData
  updateData.imageGallery = newGallery;

    // Remove deleteGallery from updateData to avoid saving it in DB
  delete updateData.deleteGallery;

  const result = await Inspiration.findByIdAndUpdate(id, updateData, { new: true });

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
