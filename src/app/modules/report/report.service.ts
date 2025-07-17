import Report from './report.model';
import httpStatus from 'http-status';
import AppError from '../../error/AppError';
import mongoose from 'mongoose';
import QueryBuilder from '../../builder/QueryBuilder';

const createReport = async (payload: {
  userId: string;
  type: 'Inspiration' | 'PostCommunity' | 'PollCommunity';
  targetId: string;
  reason: string;
}) => {
  const { userId, type, targetId, reason } = payload;

  const data: any = {
    userId,
    type,
    reason,
  };

  if (type === 'Inspiration') data.inspirationId = targetId;
  if (type === 'PostCommunity') data.postId = targetId;
  if (type === 'PollCommunity') data.pollId = targetId;

  return await Report.create(data);
};

// const getAllReports = async () => {
//   return await Report.find()
//     .populate('userId', 'name email profileImage')
//     .populate('inspirationId', 'title coverImage')
//     .populate('postId', 'title image')
//     .populate('pollId', 'title')
//     .sort({ createdAt: -1 });
// };

const getAllReports = async (query: any) => {
  // Don't add isDeleted unless it exists
  console.log('🔍 Raw query:', query);

  const baseQuery = Report.find()
    .populate('userId', 'name email profileImage')
    .populate('inspirationId', 'title coverImage')
    .populate('postId', 'title image')
    .populate('pollId', 'title');

  const reportQuery = new QueryBuilder(baseQuery, query)
    .search(['reason']) // searchable fields
    .filter()
    .paginate()
    .sort()
    .fields();

  // debug applied filters
  console.log('🧩 Final MongoDB filter:', reportQuery.modelQuery.getFilter());

  const data = await reportQuery.modelQuery;
  const meta = await reportQuery.countTotal();

  return { data, meta };
};
const getReportById = async (id: string) => {
  const report = await Report.findById(id)
    .populate('userId', 'name email profileImage')
    .populate('inspirationId', 'title coverImage')
    .populate('postId', 'title image')
    .populate('pollId', 'title');

  if (!report) throw new AppError(httpStatus.NOT_FOUND, 'Report not found');
  return report;
};

const deleteReport = async (id: string) => {
  const result = await Report.findByIdAndDelete(id);
  if (!result) throw new AppError(httpStatus.BAD_REQUEST, 'Failed to delete report');
  return result;
};

export const reportService = {
  createReport,
  getAllReports,
  getReportById,
  deleteReport,
};
