import JobApplicant from './jobApplicant.model';
import { IJobApplicant } from './jobApplicant.interface';
import AppError from '../../error/AppError';
import httpStatus from 'http-status';

const createJobApplicant = async (data: IJobApplicant) => {
  const alreadyExists = await JobApplicant.findOne({
    jobId: data.jobId,
    userId: data.userId,
  });

  if (alreadyExists) {
    throw new AppError(httpStatus.BAD_REQUEST, 'You have already applied for this job');
  }

  return await JobApplicant.create(data);
};

const getApplicantsByJob = async (jobId: string) => {
  return await JobApplicant.find({ jobId })
    .populate('userId', 'name sureName profileImage email')
    .sort({ createdAt: -1 });
};

const getApplicant = async (jobId: string, userId: string) => {
  return await JobApplicant.findOne({ jobId, userId });
};

export const JobApplicantService = {
  createJobApplicant,
  getApplicantsByJob,
  getApplicant
};
