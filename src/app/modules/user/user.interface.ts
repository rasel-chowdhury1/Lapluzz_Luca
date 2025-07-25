import { Model, ObjectId } from 'mongoose';


export interface TUserCreate {
  sureName?: string;
  name?: string;
  email: string;
  customId: string;
  password: string;
  profileImage: string;
  gender?: string;
  address?: string;
  location?: {
    type: 'Point';
    coordinates: [number, number]; // [longitude, latitude]
  };
  loginWth: 'google' | 'apple' | 'facebook' | 'credentials';
  enableNotification?: boolean;
  about?: string;
  dateOfBirth?: Date;
  wishlist?: [string];
  referralsUserList: ObjectId[];
  totalCredits: number;
  isSubBusiness: boolean;
  parentBusiness?: ObjectId;
  isBlocked: boolean;
  isDeleted: boolean;
  role: string;
  phone?: string;
  termsAndConditions: boolean;

  device: {
    ip: string;
    browser: string;
    os: string;
    device: string;
    lastLogin: string;
  };
  longitude?: string;
  latitude?: string;
  createdAt?: Date;
}

export interface TUser extends TUserCreate {
  _id: string;
}

export interface DeleteAccountPayload {
  password: string;
}

export interface UserModel extends Model<TUser> {
  isUserExist(email: string): Promise<TUser>;

  isUserActive(email: string): Promise<TUser>;

  IsUserExistById(id: string): Promise<TUser>;

  isPasswordMatched(
    plainTextPassword: string,
    hashedPassword: string,
  ): Promise<boolean>;
}

export type IPaginationOption = {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};
