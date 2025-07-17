import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import { IAddRequests } from './addRequest.interface';
import AddRequests from './addRequest.model';
import QueryBuilder from '../../builder/QueryBuilder';

const createAddRequests = async (payload: IAddRequests) => {
  const result = await AddRequests.create(payload);
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to create addRequests');
  }
  return result;
};

const getAllAddRequests = async (query: Record<string, any>) => {
  const addRequestsModel = new QueryBuilder(AddRequests.find(), query)
    .search(['name', 'type', 'status'])
    .filter()
    .paginate()
    .sort()
    .fields();

  const data = await addRequestsModel.modelQuery;
  const meta = await addRequestsModel.countTotal();

  return {
    data,
    meta,
  };
};

const getAddRequestsById = async (id: string) => {
  const result = await AddRequests.findById(id);
  if (!result) {
    throw new Error('AddRequests not found!');
  }
  return result;
};

const updateAddRequests = async (
  id: string,
  payload: Partial<IAddRequests>,
) => {
  const result = await AddRequests.findByIdAndUpdate(id, payload, {
    new: true,
  });
  if (!result) {
    throw new Error('Failed to update AddRequests');
  }
  return result;
};
const approvedAddRequests = async (id: string) => {
  const result = await AddRequests.findByIdAndUpdate(
    id,
    { status: 'approved' },
    {
      new: true,
    },
  );
  if (!result) {
    throw new Error('Failed to update AddRequests');
  }
//   notificationServices.insertNotificationIntoDb({
//     receiver: result.user,
//     message: 'addRequest approved',
//     description: `Your add request for ${result.name} has been approved`,
//     refference: result._id,
//     model_type: modeType.AddRequests,
//   });
  return result;
};
const rejectAddRequests = async (id: string) => {
  const result = await AddRequests.findByIdAndUpdate(
    id,
    { status: 'rejected' },
    {
      new: true,
    },
  );
  if (!result) {
    throw new Error('Failed to update AddRequests');
  }
//   notificationServices.insertNotificationIntoDb({
//     receiver: result.user,
//     message: 'addRequest rejected',
//     description: `Your add request for ${result.name} has been rejected`,
//     refference: result._id,
//     model_type: modeType.AddRequests,
//   });
  return result;
};

const deleteAddRequests = async (id: string) => {
  const result = await AddRequests.findByIdAndDelete(id);
  if (!result) {
    throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete addRequests');
  }
  return result;
};

export const addRequestsService = {
  createAddRequests,
  getAllAddRequests,
  getAddRequestsById,
  updateAddRequests,
  deleteAddRequests,
  rejectAddRequests,
  approvedAddRequests,
};