import BusinessProfileViews from './businessProfileViews.model';
import AppError from '../../error/AppError';
import httpStatus from 'http-status';

const addView = async (businessId: string, userId: string) => {


  const result = await BusinessProfileViews.findOneAndUpdate(
    { businessId: businessId },
    {
      $push: {
        viewUsers: {
          user: userId,
          viewedAt: new Date()
        }
      }
    },
    { upsert: true, new: true }
  );
  return result;
};

const getViewsByBusiness = async (businessId: string) => {
  const result = await BusinessProfileViews.findOne({ businessId })
    .populate('viewUsers.user', 'name email profileImage') // ✅ Correct nested populate
    .lean(); // ✅ Optional: improves read performance

  // if (!result) {
  //   throw new AppError(httpStatus.NOT_FOUND, 'No views found for this business');
  // }

  return result || null;
};


export const businessProfileViewsService = {
  addView,
  getViewsByBusiness
};
