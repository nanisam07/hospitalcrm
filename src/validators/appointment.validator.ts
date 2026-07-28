import { z } from 'zod';
import { AppointmentStatus } from '@prisma/client';

export const createAppointmentSchema = z.object({
  patientId: z.string().uuid('Invalid Patient ID'),
  doctorId: z.string().uuid('Invalid Doctor ID').optional(),
  department: z.string().min(2, 'Department is required'),
  reason: z.string().min(3, 'Reason must be at least 3 characters'),
  preferredDate: z.string().transform((val) => new Date(val)),
  preferredTime: z.string().min(2, 'Preferred time is required'),
  status: z.nativeEnum(AppointmentStatus).optional(),
});

export const updateAppointmentSchema = createAppointmentSchema.partial();

export const assignDoctorSchema = z.object({
  doctorId: z.string().uuid('Invalid Doctor ID'),
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(AppointmentStatus),
});

export const appointmentQuerySchema = z.object({
  search: z.string().optional(),
  status: z.nativeEnum(AppointmentStatus).optional(),
  department: z.string().optional(),
  doctorId: z.string().uuid().optional(),
  dateStart: z.string().optional().transform(val => (val ? new Date(val) : undefined)),
  dateEnd: z.string().optional().transform(val => (val ? new Date(val) : undefined)),
  page: z.string().optional().transform(val => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform(val => (val ? parseInt(val, 10) : 10)),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateAppointmentDto = z.infer<typeof createAppointmentSchema>;
export type UpdateAppointmentDto = z.infer<typeof updateAppointmentSchema>;
export type AssignDoctorDto = z.infer<typeof assignDoctorSchema>;
export type UpdateStatusDto = z.infer<typeof updateStatusSchema>;
export type AppointmentQueryDto = z.infer<typeof appointmentQuerySchema>;
