import Faq from './faq.model';

// Create or update single FAQ document
const upsertFaqList = async (faqItems: { question: string; answer: string }[]) => {
  const faqDoc = await Faq.findOne();

  if (faqDoc) {
    faqDoc.faqs = faqItems;
    await faqDoc.save();
    return faqDoc;
  } else {
    return await Faq.create({ faqs: faqItems });
  }
};

const getFaqList = async () => {
  return await Faq.findOne();
};

export const faqService = {
  upsertFaqList,
  getFaqList,
};
