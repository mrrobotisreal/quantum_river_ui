import * as z from 'zod';

export const emailSchema = z.object({
  email: z.string().email('Please enter a valid email'),
  subject: z.string().optional(),
  body: z.string().optional()
});
