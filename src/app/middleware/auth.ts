


import httpStatus from 'http-status';
import AppError from '../error/AppError';
import catchAsync from '../utils/catchAsync';
import { verifyToken } from '../utils/tokenManage';
import config from '../config';
import { User } from '../modules/user/user.models';
import { USER_ROLE } from '../modules/user/user.constants';


const auth = (...userRoles: string[]) => {
  return catchAsync(async (req, res, next) => {
    const token: any = req.headers?.authorization || req?.headers?.token;


    const allowGuest = userRoles.includes(USER_ROLE.GUEST);

    // 🟢 GUEST MODE (no token provided)
    if (!token) {
      if (allowGuest) {
        ( req as any).user = undefined // guest request
        return next();
      }

      // 🔴 Token required for non-guest routes
      throw new AppError(httpStatus.UNAUTHORIZED, 'You are not logged in. Please log in to continue.');
    }

    // 🟢 TOKEN PROVIDED → verify
    let decodeData;
    try {
      decodeData = verifyToken({
        token,
        access_secret: config.jwt_access_secret as string,
      });
    } catch (error) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid or expired token');
    }

    const { role, userId } = decodeData as any;

    // 🟢 Check user existence
    const isUserExist = await User.IsUserExistById(userId);

    if (!isUserExist) {
      throw new AppError(httpStatus.UNAUTHORIZED, 'User not found');
    }

    // 🟢 Role authorization
    if (userRoles.length && !userRoles.includes(role)) {
      throw new AppError(
        httpStatus.FORBIDDEN,
        'Access denied. Insufficient privileges'
      );
    }

    // 🟢 Authenticated user
    req.user = decodeData as any;
    next();
  });
};

export default auth;

// const auth = (...userRoles: string[]) => {
//   return catchAsync(async (req, res, next) => {
//     const token: any = req.headers?.authorization || req?.headers?.token;

//     // 1️⃣ Missing Token → 401 Unauthorized
//     if (!token) {
//       throw new AppError(httpStatus.UNAUTHORIZED, 'Authorization token is missing');
//     }

//     // 2️⃣ Invalid or Expired Token → 403 Forbidden
//     let decodeData;
//     try {
//       decodeData = verifyToken({
//         token,
//         access_secret: config.jwt_access_secret as string,
//       });
//     } catch (error) {
//       throw new AppError(httpStatus.UNAUTHORIZED, 'Invalid or expired token');
//     }

//     const { role, userId } = decodeData as any;

//     // 3️⃣ User Not Found → 404 Not Found
//     const isUserExist = await User.IsUserExistById(userId);

//     if (!isUserExist) {
//       throw new AppError(httpStatus.UNAUTHORIZED, 'User not found');
//     }

//     // 4️⃣ Role Not Authorized → 403 Forbidden
//     if (userRoles.length && !userRoles.includes(role)) {
//       throw new AppError(httpStatus.FORBIDDEN, 'Access denied. Insufficient privileges');
//     }

//     // ✅ Authorized → Proceed
//     req.user = decodeData as any;
//     next();
//   });
// };

// export default auth;
