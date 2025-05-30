import * as z from 'zod';

export const smsSchema = z.object({
  phone: z.string().min(1, 'Phone number is required'),
  message: z.string().optional()
});
