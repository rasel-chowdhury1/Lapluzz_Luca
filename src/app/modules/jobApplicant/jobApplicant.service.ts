import JobApplicant from './jobApplicant.model';
import { IApplicantUser } from './jobApplicant.interface';
import { Types } from 'mongoose';

const addJobApplicant = async (
  jobId: string,
  applicant: IApplicantUser
) => {
  const existing = await JobApplicant.findOne({ jobId });

  if (existing) {
    const alreadyApplied = existing.applicantUsers.some(user =>
      user.user.toString() === applicant.user.toString()
    );

    if (alreadyApplied) {
      throw new Error('User has already applied for this job');
    }

    existing.applicantUsers.push(applicant);
    return await existing.save();
  }

  return await JobApplicant.create({
    jobId: new Types.ObjectId(jobId),
    applicantUsers: [applicant],
  });
};

const getJobApplicants = async (jobId: string) => {
  return await JobApplicant.findOne({ jobId })
    .populate('applicantUsers.user', 'name email profileImage')
    .lean();
};

export const JobApplicantService = {
  addJobApplicant,
  getJobApplicants
}
