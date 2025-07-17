import { Model } from 'mongoose';

export interface IFaqItem {
  question: string;
  answer: string;
}

export interface IFaqDocument {
  faqs: IFaqItem[];
}

export type IFaqModel = Model<IFaqDocument, Record<string, unknown>>;
