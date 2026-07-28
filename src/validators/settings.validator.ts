import { z } from 'zod';

export const updateSettingsSchema = z.object({
  hospitalName: z.string().min(2).optional(),
  phone: z.string().optional(),
  emergencyNumber: z.string().optional(),
  email: z.string().email('Invalid email format').optional(),
  address: z.string().optional(),
  googleMapsLink: z.string().url('Invalid URL').optional(),
  openingTime: z.string().optional(),
  closingTime: z.string().optional(),
});

export type UpdateSettingsDto = z.infer<typeof updateSettingsSchema>;
export default updateSettingsSchema;
