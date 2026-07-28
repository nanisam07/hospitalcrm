import { AuditLog } from '@prisma/client';
import prisma from '../config/db';

export class AuditRepository {
  async log(actor: string, actorRole: string, action: string, details: string): Promise<AuditLog> {
    return prisma.auditLog.create({
      data: {
        actor,
        actorRole,
        action,
        details,
      },
    });
  }

  async findAll(options: { skip?: number; take?: number } = {}): Promise<{ data: AuditLog[]; total: number }> {
    const { skip = 0, take = 20 } = options;
    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        skip,
        take,
        orderBy: {
          timestamp: 'desc',
        },
      }),
      prisma.auditLog.count(),
    ]);

    return { data, total };
  }
}
export default AuditRepository;
