import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import WishList from './wishlist.model';
import { User } from '../user/user.models';
import Business from '../business/business.model';
import Job from '../job/job.model';
import Event from '../event/event.model';

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
  const wishlist = await WishList.findOne({ userId }).lean();

  if (!wishlist) {
    throw new AppError(httpStatus.NOT_FOUND, 'No wishlist found for user');
  }

  console.log({wishlist})
  // Manually populate each folder's references
  const populatedFolders = await Promise.all(
    wishlist.folders.map(async (folder) => {
      const [businesses, events, jobs] = await Promise.all([
        Business.find({ _id: { $in: folder.businesses } }).select('name coverImage'),
        Event.find({ _id: { $in: folder.events } }).select('name coverImage'),
        Job.find({ _id: { $in: folder.jobs } }).select('title coverImage'),
      ]);

      return {
        ...folder,
        businesses,
        events,
        jobs,
      };
    })
  );

  console.log({populatedFolders})

  return {
    ...wishlist,
    folders: populatedFolders,
  };
};

const updateFolderIsActive = async (
  userId: string,
  folderName: string,
  isActive: boolean
) => {
  const updatedWishlist = await WishList.findOneAndUpdate(
    { userId, 'folders.folderName': folderName },
    {
      $set: {
        'folders.$.isActive': isActive,
      },
    },
    { new: true }
  ).lean();

  if (!updatedWishlist) {
    throw new AppError(httpStatus.NOT_FOUND, 'Folder or user not found');
  }

  return updatedWishlist;
};

const getCheckWishlistByUser = async (userId: string) => {
  const wishlist = await WishList.findOne({ userId }).lean();

  if (!wishlist) {
    throw new AppError(httpStatus.NOT_FOUND, 'No wishlist found for user');
  }

  const updatedFolders = await Promise.all(
    wishlist.folders.map(async (folder) => {
      const totalItems =
        (folder.businesses?.length || 0) +
        (folder.events?.length || 0) +
        (folder.jobs?.length || 0);

      let coverImage = null;

      if (folder.businesses?.[0]) {
        const business = await Business.findById(folder.businesses[0])
          .select('coverImage')
          .lean();
        coverImage = business?.coverImage || null;
      } else if (folder.events?.[0]) {
        const event = await Event.findById(folder.events[0])
          .select('coverImage')
          .lean();
        coverImage = event?.coverImage || null;
      } else if (folder.jobs?.[0]) {
        const job = await Job.findById(folder.jobs[0])
          .select('coverImage')
          .lean();
        coverImage = job?.coverImage || null;
      }

      return {
        folderName: folder.folderName,
        isActive: folder.isActive, // fallback to default true
        totalItems,
        coverImage,
      };
    })
  );

  return updatedFolders;
};


export const wishListService = {
  createOrUpdateFolder,
  getWishlistByUser,
  getCheckWishlistByUser,
  updateFolderIsActive
};
