import { TUser } from "../modules/user/user.interface";


let adminData: TUser | null = null;

export const setAdminData = (data: TUser) => {
  adminData = data;
};

export const getAdminData = (): TUser | null => {
  return adminData;
};


export const getAdminId = () => {
    return adminData?._id;
}