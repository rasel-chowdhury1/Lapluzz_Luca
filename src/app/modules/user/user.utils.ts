
import config from "../../config";
import { createToken } from "../../utils/tokenManage";

export const generateLocation = (longitude: string, latitude: string) => {

      // Build location if coordinates are provided
    const lng = parseFloat(String(longitude));
    const lat = parseFloat(String(latitude));

    if (isNaN(lng) || isNaN(lat)) {
      throw new Error(
        'Invalid longitude or latitude',
      );
    }

    
    return {
      type: 'Point',
      coordinates: [lng, lat],
    };
  
}

type TTokenPayload = {
  userId: string;
  role: string;
  loginWth: string;
  appleId?: string;
  email?: string;
  fullName?: string;
  phone?: string;
  profileImage?: string;
};

export const generateTokens = (payload: TTokenPayload) => {

  const accessToken = createToken({
    payload,
    access_secret: config.jwt_access_secret as string,
    expity_time: config.jwt_access_expires_in as string,
  });

  const refreshToken = createToken({
    payload: payload,
    access_secret: config.jwt_refresh_secret as string,
    expity_time: config.jwt_refresh_expires_in as string,
  });

  return { accessToken, refreshToken };
};

export const generateAndReturnTokens = (user: any) => {
  
    const { accessToken, refreshToken } = generateTokens({
    userId: user._id.toString(),
    role: user.role,
    loginWth: user.loginWth,
    appleId: user.appleId,
    email: user.email,
    fullName: user.fullName,
    phone: user.phone,
    profileImage: user.profileImage
  }
);
    return { user, accessToken, refreshToken };
  };