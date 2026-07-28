import { Prisma, Conversation } from '@prisma/client';
import prisma from '../config/db';

export interface ConversationFilterOptions {
  skip?: number;
  take?: number;
}

export class ConversationRepository {
  async create(data: Prisma.ConversationUncheckedCreateInput): Promise<Conversation> {
    return prisma.conversation.create({
      data,
    });
  }

  async findByPatientId(
    patientId: string,
    options: ConversationFilterOptions = {}
  ): Promise<{ data: Conversation[]; total: number }> {
    const { skip = 0, take = 50 } = options;

    const where = { patientId };

    const [data, total] = await Promise.all([
      prisma.conversation.findMany({
        where,
        skip,
        take,
        orderBy: {
          timestamp: 'asc',
        },
      }),
      prisma.conversation.count({ where }),
    ]);

    return { data, total };
  }

  async findLatestConversationsGroupByPatient(options: { skip?: number; take?: number } = {}): Promise<any[]> {
    const { skip = 0, take = 20 } = options;

    // Use Prisma query to find unique patients with their last conversation message
    // A clean approach is querying all patients and joining their last message,
    // or using raw SQL, or finding conversations ordered by timestamp grouped by patient.
    // Let's do a findMany on Patient and include conversations sorted by timestamp desc, taking the first.
    return prisma.patient.findMany({
      skip,
      take,
      include: {
        conversations: {
          orderBy: {
            timestamp: 'desc',
          },
          take: 1,
        },
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });
  }
}
