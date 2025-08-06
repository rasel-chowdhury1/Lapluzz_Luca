import Faq from './faq.model';
import { IFaqDocument } from './faq.interface';

interface IFaqItem {
  question: string;
  answer: string;
}

const createFaqs = async (payload: IFaqItem[]) => {
  // Find existing FAQ document
  let existingFaqDoc = await Faq.findOne();
console.log({existingFaqDoc})
  if (existingFaqDoc) {
    // Push all items into the existing faqs array
    existingFaqDoc.faqs.push(...payload);
    await existingFaqDoc.save();
    return existingFaqDoc;
  }

  console.log(payload)
  // If no existing document, create new one with the array
  const newFaqDoc = await Faq.create({faqs: payload});
  console.log({newFaqDoc})
  return newFaqDoc;
};

// Get all FAQs
const getAllFaqs = async (): Promise<IFaqDocument | null> => {
  const result = await Faq.findOne(); // Only one FAQ document is expected
  return result;
};

// Update specific FAQ item or push a new one
const updateFaqs = async (
  id: string,
  payload: {
    type: 'update' | 'push';
    index?: number; // required for 'update'
    faqItem?: { question: string; answer: string };
  }
): Promise<IFaqDocument | null> => {
  if (!payload.faqItem) {
    throw new Error('faqItem is required');
  }

  if (payload.type === 'update') {
    if (typeof payload.index !== 'number') {
      throw new Error('Index is required for update operation');
    }

    const updateKey = `faqs.${payload.index}`;
    return await Faq.findByIdAndUpdate(
      id,
      { $set: { [updateKey]: payload.faqItem } },
      { new: true }
    );
  } else if (payload.type === 'push') {
    return await Faq.findByIdAndUpdate(
      id,
      { $push: { faqs: payload.faqItem } },
      { new: true }
    );
  }

  return null;
};

const deleteFaqItem = async (
  id: string,
  index: number
): Promise<IFaqDocument | null> => {
  const faqDoc = await Faq.findById(id);

  console.log({index})

  if (!faqDoc) {
    throw new Error('FAQ document not found');
  }

  if (index < 0 || index >= faqDoc.faqs.length) {
    throw new Error('Invalid index');
  }

  // Remove the item from the array
  faqDoc.faqs.splice(index, 1);
  await faqDoc.save();

  return faqDoc;
};


export default {
  createFaqs,
  getAllFaqs,
  updateFaqs,
  deleteFaqItem
};

