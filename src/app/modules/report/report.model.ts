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

    type: {
      type: String,
      enum: ['Inspiration', 'PostCommunity', 'PollCommunity'],
      required: true
    },

    reason: { type: String, required: true },
    isCompleted: {type: Boolean, required: false},
    isNotified: {type: Boolean, required: false},
    isDeleted: {type: Boolean, required: false},
  },
  {
    timestamps: true
  }
);

const Report = model<IReport, IReportModel>('Report', reportSchema);
export default Report;

