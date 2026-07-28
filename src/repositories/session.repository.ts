import { Prisma, ChatSession } from '@prisma/client';
import prisma from '../config/db';

export class SessionRepository {
  async findByPhone(patientPhone: string): Promise<ChatSession | null> {
    return prisma.chatSession.findUnique({
      where: { patientPhone },
    });
  }

  async create(patientPhone: string, step: string, data: any): Promise<ChatSession> {
    return prisma.chatSession.create({
      data: {
        patientPhone,
        step,
        data: data as Prisma.InputJsonValue,
      },
    });
  }

  async update(patientPhone: string, step: string, data: any): Promise<ChatSession> {
    return prisma.chatSession.update({
      where: { patientPhone },
      data: {
        step,
        data: data as Prisma.InputJsonValue,
      },
    });
  }

  async delete(patientPhone: string): Promise<ChatSession> {
    return prisma.chatSession.delete({
      where: { patientPhone },
    });
  }
}
