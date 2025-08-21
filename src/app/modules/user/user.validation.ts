import { z } from 'zod';

const userValidationSchema = z.object({
  body: z.object({
    sureName: z
      .string()
      .min(1, { message: 'Full name is required' })
      .optional(),
    lastName: z
      .string()
      .min(1, { message: 'Last name is required' })
      .optional(),
    name: z
      .string()
      .min(1, { message: 'Full name is required' })
      .optional(),
    email: z.string().email({ message: 'Invalid email format' }),
    password: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters long' }),
    phone: z
      .string()
      .min(10, { message: 'Phone number must be at least 10 digits' })
      .optional(),
    about: z.string().optional(),
    role: z.string(),
    image: z.string().optional()
  }),
});
const adminValidationSchema = z.object({
  body: z.object({
    name: z
      .string()
      .min(1, { message: 'Name is required' })
      .optional(),
    email: z.string().email({ message: 'Invalid email format' }),
    password: z
      .string()
      .min(6, { message: 'Password must be at least 6 characters long' })
  }),
});

export const userValidation = {
  userValidationSchema,
  adminValidationSchema
};
