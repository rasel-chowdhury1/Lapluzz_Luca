import { Schema, model } from 'mongoose';
import { IFaqDocument, IFaqModel } from './faq.interface';

const faqItemSchema = new Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    isDeleted: {type: Boolean, default: false}
  },
  { _id: false }
);

const faqSchema = new Schema<IFaqDocument>(
  {
    faqs: {
      type: [faqItemSchema],
      required: true,
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const Faq = model<IFaqDocument, IFaqModel>('Faq', faqSchema);
export default Faq;
