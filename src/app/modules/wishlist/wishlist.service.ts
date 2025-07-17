import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import WishList from './wishlist.model';
import { User } from '../user/user.models';

// const createOrUpdateFolder = async (
//   userId: string,
//   folderName: string,
//   businesses: string[] = [],
//   events: string[] = [],
//   jobs: string[] = []
// ) => {
//   const wishlist = await WishList.findOneAndUpdate(
//     {
//       userId,
//       'folders.folderName': { $ne: folderName } // only if folder doesn't exist
//     },
//     {
//       $push: {
//         folders: {
//           folderName,
//           businesses,
//           events,
//           jobs
//         }
//       }
//     },
//     { upsert: true, new: true }
//   );

//   return wishlist;
// };


const createOrUpdateFolder = async (
  userId: string,
  folderName: string,
  businessId?: string,
  eventId?: string,
  jobId?: string
) => {
  const hasValidInput = !!businessId || !!eventId || !!jobId;
  if (!hasValidInput) {
    throw new Error('You must provide a businessId, eventId, or jobId');
  }

  console.log({userId,folderName})

  const wishlist = await WishList.findOne({ userId });

  if (!wishlist) {
    // 🌱 First time: Create wishlist and folder
    const newFolder: any = {
      folderName,
      businesses: businessId ? [businessId] : [],
      events: eventId ? [eventId] : [],
      jobs: jobId ? [jobId] : [],
    };
    
    const newWishlist =  await WishList.create({
      userId,
      folders: [newFolder],
    });

    // ALSO update User's wishlist array with folderName
    await User.findByIdAndUpdate(userId, {
      $addToSet: { wishlist: folderName },
    });

    return newWishlist;
  }

  // 🧠 Check for existing folder
  const folder = wishlist.folders.find(f => f.folderName === folderName);

  if (!folder) {
    // 📁 Create new folder with the ID
    const newFolder: any = {
      folderName,
      businesses: businessId ? [businessId] : [],
      events: eventId ? [eventId] : [],
      jobs: jobId ? [jobId] : [],
    };
    wishlist.folders.push(newFolder);

    // ALSO update User's wishlist array with folderName (if not already there)
    await User.findByIdAndUpdate(userId, {
      $addToSet: { wishlist: folderName },
    });
  } else {
    // 🛠️ Folder exists — add to correct list without duplicate
    if (businessId && !folder.businesses.includes(businessId)) {
      folder.businesses.push(businessId);
    }

    if (eventId && !folder.events.includes(eventId)) {
      folder.events.push(eventId);
    }

    if (jobId && !folder.jobs.includes(jobId)) {
      folder.jobs.push(jobId);
    }
  }

  await wishlist.save();
  return wishlist;
};


const getWishlistByUser = async (userId: string) => {
  const wishlist = await WishList.findOne({ userId })
    .populate({
      path: 'folders.businesses',
      model: 'Business',
      select: 'name coverImage',
    })
    .populate({
      path: 'folders.events',
      model: 'Event',
      select: 'name coverImage',
    })
    // .populate({
    //   path: 'folders.jobs',
    //   model: 'Job',
    //   select: 'title companyName',
    // });

  if (!wishlist) {
    throw new AppError(httpStatus.NOT_FOUND, 'No wishlist found for user');
  }

  return wishlist;
};

const getCheckWishlistByUser = async (userId: string) => {
  const wishlist = await WishList.findOne({ userId });

  if (!wishlist) {
    throw new AppError(httpStatus.NOT_FOUND, 'No wishlist found for user');
  }

  const updatedFolders = wishlist.folders.map((folder) => {
    const totalItems =
      (folder.businesses?.length || 0) +
      (folder.events?.length || 0) +
      (folder.jobs?.length || 0);

    return {
      folderName: folder.folderName,
      totalItems,
    };
  });

  return {
    ...wishlist.toObject(),
    folders: updatedFolders,
  };
};


export const wishListService = {
  createOrUpdateFolder,
  getWishlistByUser,
  getCheckWishlistByUser
};
