import { Prisma, Patient } from '@prisma/client';
import prisma from '../config/db';

export interface PatientFilterOptions {
  search?: string;
  skip?: number;
  take?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class PatientRepository {
  async findById(id: string): Promise<Patient | null> {
    return prisma.patient.findUnique({
      where: { id },
    });
  }

  async findByPhone(phone: string): Promise<Patient | null> {
    return prisma.patient.findUnique({
      where: { phone },
    });
  }

  async create(data: Prisma.PatientCreateInput): Promise<Patient> {
    return prisma.patient.create({
      data,
    });
  }

  async update(id: string, data: Prisma.PatientUpdateInput): Promise<Patient> {
    return prisma.patient.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Patient> {
    return prisma.patient.delete({
      where: { id },
    });
  }

  async findAll(options: PatientFilterOptions): Promise<{ data: Patient[]; total: number }> {
    const { search, skip = 0, take = 10, sortBy = 'createdAt', sortOrder = 'desc' } = options;

    const where: Prisma.PatientWhereInput = {};

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.patient.count({ where }),
    ]);

    return { data, total };
  }
}
