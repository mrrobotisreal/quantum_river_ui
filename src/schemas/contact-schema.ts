import * as z from 'zod';

export const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  organization: z.string().optional(),
  url: z.string().url().optional().or(z.literal(''))
});
