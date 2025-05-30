import * as z from 'zod';

export const wifiSchema = z.object({
  ssid: z.string().min(1, 'SSID is required'),
  password: z.string().optional(),
  security: z.enum(['WPA', 'WEP', 'nopass']),
  hidden: z.boolean().optional()
});
