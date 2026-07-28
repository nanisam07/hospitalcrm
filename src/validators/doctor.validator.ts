import { z } from 'zod';

export const createDoctorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  department: z.string().min(2, 'Department is required'),
  specialization: z.string().min(2, 'Specialization is required'),
  availableDays: z.array(z.string()).nonempty('At least one available day is required'),
  availableTime: z.string().min(2, 'Available time is required (e.g. 09:00 - 17:00)'),
});

export const updateDoctorSchema = createDoctorSchema.partial();

export const doctorQuerySchema = z.object({
  search: z.string().optional(),
  department: z.string().optional(),
  page: z.string().optional().transform(val => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val, 10) : 10)),
  sortBy: z.string().optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
});

export type CreateDoctorDto = z.infer<typeof createDoctorSchema>;
export type UpdateDoctorDto = z.infer<typeof updateDoctorSchema>;
export type DoctorQueryDto = z.infer<typeof doctorQuerySchema>;
