
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
export const generateTokens = (userId: string, role: string, fullName?: string, email?: string, phone?: string) => {
  const jwtPayload = { userId, role, fullName, email, phone };

  const accessToken = createToken({
    payload: jwtPayload,
    access_secret: config.jwt_access_secret as string,
    expity_time: config.jwt_access_expires_in as string,
  });

  const refreshToken = createToken({
    payload: jwtPayload,
    access_secret: config.jwt_refresh_secret as string,
    expity_time: config.jwt_refresh_expires_in as string,
  });

  return { accessToken, refreshToken };
};

export const generateAndReturnTokens = (user: any) => {
    const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.role, user.fullName, user.email);
    return { user, accessToken, refreshToken };
  };