import prisma from '../config/db';
import { AppointmentStatus } from '@prisma/client';
import { AuditRepository } from '../repositories/audit.repository';

export class DashboardService {
  private auditRepository: AuditRepository;

  constructor() {
    this.auditRepository = new AuditRepository();
  }

  async getMetrics() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalPatients,
      totalDoctors,
      todayAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments
    ] = await Promise.all([
      prisma.patient.count(),
      prisma.doctor.count(),
      prisma.appointment.count({
        where: {
          preferredDate: {
            gte: today,
            lt: tomorrow,
          },
        },
      }),
      prisma.appointment.count({ where: { status: AppointmentStatus.PENDING } }),
      prisma.appointment.count({ where: { status: AppointmentStatus.CONFIRMED } }),
      prisma.appointment.count({ where: { status: AppointmentStatus.COMPLETED } }),
      prisma.appointment.count({ where: { status: AppointmentStatus.CANCELLED } }),
    ]);

    // Group appointments by department
    const appointmentsByDeptRaw = await prisma.appointment.groupBy({
      by: ['department'],
      _count: {
        id: true,
      },
    });

    const appointmentsByDept = appointmentsByDeptRaw.map((item) => ({
      department: item.department,
      count: item._count.id,
    }));

    // Calculate Completion / Cancellation Rates
    const totalConcluded = completedAppointments + cancelledAppointments;
    const completionRate = totalConcluded > 0 ? (completedAppointments / totalConcluded) * 100 : 0;
    const cancellationRate = totalConcluded > 0 ? (cancelledAppointments / totalConcluded) * 100 : 0;

    return {
      totalPatients,
      totalDoctors,
      todayAppointments,
      pendingAppointments,
      confirmedAppointments,
      completedAppointments,
      cancelledAppointments,
      completionRate: Math.round(completionRate * 10) / 10,
      cancellationRate: Math.round(cancellationRate * 10) / 10,
      appointmentsByDept,
    };
  }

  async getReports(days: number = 7) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    // Dynamic database trends over time
    const appointmentTrends = await prisma.appointment.findMany({
      where: {
        createdAt: {
          gte: sinceDate,
        },
      },
      select: {
        id: true,
        status: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    return {
      daysRange: days,
      totalBooked: appointmentTrends.length,
      trends: appointmentTrends,
    };
  }

  async getAuditLogs(options: { skip?: number; take?: number } = {}) {
    return this.auditRepository.findAll(options);
  }
}
export default DashboardService;
