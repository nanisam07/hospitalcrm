import { Prisma, Appointment, AppointmentStatus } from '@prisma/client';
import prisma from '../config/db';

export interface AppointmentFilterOptions {
  search?: string;
  status?: AppointmentStatus;
  department?: string;
  doctorId?: string;
  dateStart?: Date;
  dateEnd?: Date;
  skip?: number;
  take?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class AppointmentRepository {
  async findById(id: string): Promise<Appointment | null> {
    return prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        doctor: true,
      },
    });
  }

  async create(data: Prisma.AppointmentUncheckedCreateInput): Promise<Appointment> {
    return prisma.appointment.create({
      data,
      include: {
        patient: true,
        doctor: true,
      },
    });
  }

  async update(id: string, data: Prisma.AppointmentUncheckedUpdateInput): Promise<Appointment> {
    return prisma.appointment.update({
      where: { id },
      data,
      include: {
        patient: true,
        doctor: true,
      },
    });
  }

  async delete(id: string): Promise<Appointment> {
    return prisma.appointment.delete({
      where: { id },
    });
  }

  async findAll(options: AppointmentFilterOptions): Promise<{ data: Appointment[]; total: number }> {
    const {
      search,
      status,
      department,
      doctorId,
      dateStart,
      dateEnd,
      skip = 0,
      take = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = options;

    const where: Prisma.AppointmentWhereInput = {};

    if (status) {
      where.status = status;
    }

    if (department) {
      where.department = { equals: department, mode: 'insensitive' };
    }

    if (doctorId) {
      where.doctorId = doctorId;
    }

    if (dateStart || dateEnd) {
      where.preferredDate = {};
      if (dateStart) {
        where.preferredDate.gte = dateStart;
      }
      if (dateEnd) {
        where.preferredDate.lte = dateEnd;
      }
    }

    if (search) {
      where.OR = [
        { reason: { contains: search, mode: 'insensitive' } },
        {
          patient: {
            fullName: { contains: search, mode: 'insensitive' },
          },
        },
        {
          patient: {
            phone: { contains: search, mode: 'insensitive' },
          },
        },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.appointment.findMany({
        where,
        skip,
        take,
        include: {
          patient: true,
          doctor: true,
        },
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.appointment.count({ where }),
    ]);

    return { data, total };
  }

  async countByStatus(status: AppointmentStatus): Promise<number> {
    return prisma.appointment.count({
      where: { status },
    });
  }

  async countTodayAppointments(): Promise<number> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    return prisma.appointment.count({
      where: {
        preferredDate: {
          gte: today,
          lt: tomorrow,
        },
      },
    });
  }
}
