import { Schema, model } from 'mongoose';
import { IReport, IReportModel } from './report.interface';

const reportSchema = new Schema<IReport>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },

    // Dynamically assigned based on type:
    inspirationId: {
      type: Schema.Types.ObjectId, ref: 'Inspiration'
    },
    postId: {
      type: Schema.Types.ObjectId, ref: 'PostCommunity'
    },
    pollId: {
      type: Schema.Types.ObjectId, ref: 'PollCommunity'
    },
    businessId: {
      type: Schema.Types.ObjectId, ref: 'Business'
    },
    eventId: {
      type: Schema.Types.ObjectId, ref: 'Event'
    },
    jobId: {
      type: Schema.Types.ObjectId, ref: 'Job'
    },

    type: {
      type: String,
      enum: ['Inspiration', 'PostCommunity', 'PollCommunity', "Business", "Event", "Job"],
      required: true
    },

    reason: { 
      type: String, 
      required: true
     },
    isCompleted: {
      type: Boolean, 
      default: false
    },
    isNotified: {
      type: Boolean, 
      default: false
    },
    isDeleted: {
      type: Boolean, 
      default: false
    },
  },
  {
    timestamps: true
  }
);

const Report = model<IReport, IReportModel>('Report', reportSchema);
export default Report;

