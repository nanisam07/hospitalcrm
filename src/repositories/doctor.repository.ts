import { Prisma, Doctor } from '@prisma/client';
import prisma from '../config/db';

export interface DoctorFilterOptions {
  search?: string;
  department?: string;
  skip?: number;
  take?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class DoctorRepository {
  async findById(id: string): Promise<Doctor | null> {
    return prisma.doctor.findUnique({
      where: { id },
    });
  }

  async create(data: Prisma.DoctorCreateInput): Promise<Doctor> {
    return prisma.doctor.create({
      data,
    });
  }

  async update(id: string, data: Prisma.DoctorUpdateInput): Promise<Doctor> {
    return prisma.doctor.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Doctor> {
    return prisma.doctor.delete({
      where: { id },
    });
  }

  async findAll(options: DoctorFilterOptions): Promise<{ data: Doctor[]; total: number }> {
    const { search, department, skip = 0, take = 10, sortBy = 'name', sortOrder = 'asc' } = options;

    const where: Prisma.DoctorWhereInput = {};

    if (department) {
      where.department = { equals: department, mode: 'insensitive' };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { specialization: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [data, total] = await Promise.all([
      prisma.doctor.findMany({
        where,
        skip,
        take,
        orderBy: {
          [sortBy]: sortOrder,
        },
      }),
      prisma.doctor.count({ where }),
    ]);

    return { data, total };
  }
}
