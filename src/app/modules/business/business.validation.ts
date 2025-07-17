import z from 'zod';

const SocialLinksSchema = z.object({
  facebook: z.string().url().optional().or(z.literal('')),
  instagram: z.string().url().optional().or(z.literal('')),
  twitter: z.string().url().optional().or(z.literal('')),
  tiktok: z.string().url().optional().or(z.literal('')),
});

const FaqSchema = z.object({
  question: z.string().min(1),
  answer: z.string().min(1),
});

const AvailabilitiesSchema = z.object({
  day: z.array(z.string().min(1)).min(1),
  startTime: z.string().min(1), // You may refine with regex for HH:mm if needed
  endTime: z.string().min(1),
});

const LocationSchema = z.object({
  type: z.literal('Point'),
  coordinates: z
    .array(z.number())
    .length(2, 'Coordinates must be longitude and latitude'),
});

// Main create schema
export const createBusinessSchema = z.object({
  body: z.object({
    name: z.string().min(1),
    email: z.string().email().optional(),
    phoneNumber: z.string().min(10).optional(),
    website: z.string().url().optional(),
    socialLinks: SocialLinksSchema.optional(),
    author: z.string(), // ObjectId string length
    shortDescription: z.string().optional(),
    description: z.string().optional(),
    faq: z.array(FaqSchema).optional(),
    providerType: z.string().length(24),
    eventType: z.array(z.string().length(24)).optional(),
    additionalServices: z.array(z.string().length(24)).optional(),
    availabilities: AvailabilitiesSchema,
    priceRange: z.string().optional(),
    maxGuest: z.number().int().nonnegative(),
    address: z.string().min(1),
    location: LocationSchema,
    isDeleted: z.boolean().default(false),
  }),
});