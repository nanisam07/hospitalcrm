import { AppointmentRepository, AppointmentFilterOptions } from '../repositories/appointment.repository';
import { DoctorRepository } from '../repositories/doctor.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { ConversationRepository } from '../repositories/conversation.repository';
import { MessagingServiceFactory } from './messaging.factory';
import { Appointment, AppointmentStatus, Prisma, SenderType, MessageType, DeliveryStatus } from '@prisma/client';
// Emit function callback container (initialized in server.ts)
let ioInstance: any = null;
export const setAppointmentSocketIoInstance = (io: any) => {
  ioInstance = io;
};

export class AppointmentService {
  private appointmentRepository: AppointmentRepository;
  private doctorRepository: DoctorRepository;
  private auditRepository: AuditRepository;
  private conversationRepository: ConversationRepository;

  constructor() {
    this.appointmentRepository = new AppointmentRepository();
    this.doctorRepository = new DoctorRepository();
    this.auditRepository = new AuditRepository();
    this.conversationRepository = new ConversationRepository();
  }

  async createAppointment(data: Prisma.AppointmentUncheckedCreateInput, actorId: string, actorRole: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.create(data);

    // Socket notify
    if (ioInstance) {
      ioInstance.emit('new_appointment', appointment);
    }

    await this.auditRepository.log(
      actorId,
      actorRole,
      'Appointment Created',
      `Manual appointment created for Patient ID: ${appointment.patientId} on ${appointment.preferredDate}.`
    );

    return appointment;
  }

  async getAppointmentById(id: string): Promise<Appointment | null> {
    return this.appointmentRepository.findById(id);
  }

  async updateAppointment(id: string, data: Prisma.AppointmentUncheckedUpdateInput, actorId: string, actorRole: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.update(id, data);

    // Socket emit
    if (ioInstance) {
      ioInstance.emit('update_appointment', appointment);
    }

    await this.auditRepository.log(
      actorId,
      actorRole,
      'Appointment Updated',
      `Appointment ${id} details updated.`
    );

    return appointment;
  }

  async assignDoctorAndConfirm(id: string, doctorId: string, actorId: string, actorRole: string): Promise<Appointment> {
    const doctor = await this.doctorRepository.findById(doctorId);
    if (!doctor) {
      throw new Error('Doctor not found');
    }

    const originalAppointment = await this.appointmentRepository.findById(id);
    if (!originalAppointment) {
      throw new Error('Appointment not found');
    }

    // Update appointment doctor and set status to ASSIGNED/CONFIRMED
    const updatedAppointment = await this.appointmentRepository.update(id, {
      doctorId,
      status: AppointmentStatus.CONFIRMED, // Auto-confirm upon assignment
    });

    const patient = (updatedAppointment as any).patient;
    const phone = patient.phone;

    // Send WhatsApp notification
    const responseMessage = `Hello ${patient.fullName}! 🏥 Your appointment request in the ${updatedAppointment.department} department has been CONFIRMED.\n\n` +
      `Details:\n` +
      `• Assigned Doctor: ${doctor.name} (${doctor.specialization})\n` +
      `• Date: ${new Date(updatedAppointment.preferredDate).toLocaleDateString()}\n` +
      `• Time: ${updatedAppointment.preferredTime}\n` +
      `• Status: CONFIRMED\n\n` +
      `Please arrive 15 minutes before your scheduled slot. If you need to reschedule, please contact us.`;

    const messagingService = MessagingServiceFactory.getService();
    await messagingService.sendText(phone, responseMessage);

    // Record Conversation log
    await this.conversationRepository.create({
      patientId: patient.id,
      message: responseMessage,
      sender: SenderType.SYSTEM,
      messageType: MessageType.TEXT,
      deliveryStatus: DeliveryStatus.READ,
    });

    // Socket trigger
    if (ioInstance) {
      ioInstance.emit('update_appointment', updatedAppointment);
      ioInstance.emit('new_message', {
        patientId: patient.id,
        message: responseMessage,
        sender: SenderType.SYSTEM,
        timestamp: new Date(),
      });
    }

    // Audit logs
    await this.auditRepository.log(
      actorId,
      actorRole,
      'Doctor Assigned',
      `Doctor ${doctor.name} assigned to appointment ${id}.`
    );

    await this.auditRepository.log(
      actorId,
      actorRole,
      'Appointment Status Changed',
      `Appointment ${id} status updated to CONFIRMED.`
    );

    return updatedAppointment;
  }

  async updateAppointmentStatus(id: string, status: AppointmentStatus, actorId: string, actorRole: string): Promise<Appointment> {
    const originalAppointment = await this.appointmentRepository.findById(id);
    if (!originalAppointment) {
      throw new Error('Appointment not found');
    }

    const updatedAppointment = await this.appointmentRepository.update(id, { status });
    const patient = (updatedAppointment as any).patient;

    // Notify patient about changes if needed (e.g. Completed, Cancelled)
    let notifyMessage = '';
    if (status === AppointmentStatus.CANCELLED) {
      notifyMessage = `Dear ${patient.fullName}, your appointment scheduled for ${new Date(updatedAppointment.preferredDate).toLocaleDateString()} has been CANCELLED.`;
    } else if (status === AppointmentStatus.COMPLETED) {
      notifyMessage = `Thank you ${patient.fullName}! Your consultation has been marked as COMPLETED. We value your feedback. Get well soon!`;
    } else if (status === AppointmentStatus.CHECKED_IN) {
      notifyMessage = `Welcome ${patient.fullName}! You have successfully checked in. Please wait outside the consultation chamber.`;
    }

    if (notifyMessage) {
      const messagingService = MessagingServiceFactory.getService();
      await messagingService.sendText(patient.phone, notifyMessage);

      await this.conversationRepository.create({
        patientId: patient.id,
        message: notifyMessage,
        sender: SenderType.SYSTEM,
        messageType: MessageType.TEXT,
        deliveryStatus: DeliveryStatus.READ,
      });
    }

    // Socket emit
    if (ioInstance) {
      ioInstance.emit('update_appointment', updatedAppointment);
      if (notifyMessage) {
        ioInstance.emit('new_message', {
          patientId: patient.id,
          message: notifyMessage,
          sender: SenderType.SYSTEM,
          timestamp: new Date(),
        });
      }
    }

    // Audit
    await this.auditRepository.log(
      actorId,
      actorRole,
      'Appointment Status Changed',
      `Appointment ${id} status updated from ${originalAppointment.status} to ${status}.`
    );

    return updatedAppointment;
  }

  async deleteAppointment(id: string, actorId: string, actorRole: string): Promise<Appointment> {
    const appointment = await this.appointmentRepository.delete(id);

    // Socket notify
    if (ioInstance) {
      ioInstance.emit('delete_appointment', { id });
    }

    await this.auditRepository.log(
      actorId,
      actorRole,
      'Appointment Deleted',
      `Appointment ID: ${id} was deleted.`
    );

    return appointment;
  }

  async getAllAppointments(options: AppointmentFilterOptions) {
    return this.appointmentRepository.findAll(options);
  }
}
export default AppointmentService;
