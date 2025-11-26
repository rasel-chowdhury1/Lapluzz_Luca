
import { ObjectId, Model } from 'mongoose';

export type ReportType = 'Inspiration' | 'PostCommunity' | 'PollCommunity';

export interface IReport {
  userId: ObjectId;
  type: ReportType;
  reason: string;

  // Only one of these will be filled based on `type`
  inspirationId?: ObjectId;
  postId?: ObjectId;
  pollId?: ObjectId;
  businessId?: ObjectId;
  eventId?: ObjectId;
  jobId?: ObjectId;
  isCompleted: boolean;
  isNotified: boolean;
  isDeleted: boolean;
}

export type IReportModel = Model<IReport>;

