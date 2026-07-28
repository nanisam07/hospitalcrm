import { ConversationRepository, ConversationFilterOptions } from '../repositories/conversation.repository';
import { PatientRepository } from '../repositories/patient.repository';
import { MessagingServiceFactory } from './messaging.factory';
import { Conversation, SenderType, MessageType, DeliveryStatus } from '@prisma/client';
import logger from '../config/logger';

let ioInstance: any = null;
export const setConversationSocketIoInstance = (io: any) => {
  ioInstance = io;
};

export class ConversationService {
  private conversationRepository: ConversationRepository;
  private patientRepository: PatientRepository;

  constructor() {
    this.conversationRepository = new ConversationRepository();
    this.patientRepository = new PatientRepository();
  }

  async getHistoryByPatientId(patientId: string, options: ConversationFilterOptions) {
    return this.conversationRepository.findByPatientId(patientId, options);
  }

  async getInbox(options: { skip?: number; take?: number } = {}) {
    return this.conversationRepository.findLatestConversationsGroupByPatient(options);
  }

  async sendManualMessage(
    patientId: string,
    message: string,
    sender: SenderType = SenderType.DOCTOR, // or SYSTEM
    messageType: MessageType = MessageType.TEXT,
    _actorId: string
  ): Promise<Conversation> {
    const patient = await this.patientRepository.findById(patientId);
    if (!patient) {
      throw new Error('Patient not found');
    }

    // Call WhatsApp / Mock messaging service
    const messagingService = MessagingServiceFactory.getService();
    let sent = false;

    if (messageType === MessageType.TEXT) {
      sent = await messagingService.sendText(patient.phone, message);
    } else {
      // Stub mapping for template/image/location if specified
      sent = await messagingService.sendText(patient.phone, message);
    }

    if (!sent) {
      logger.warn(`Failed to send manual message to patient ${patient.fullName} (${patient.phone})`);
    }

    // Create conversation record
    const convRecord = await this.conversationRepository.create({
      patientId,
      message,
      sender,
      messageType,
      deliveryStatus: sent ? DeliveryStatus.DELIVERED : DeliveryStatus.FAILED,
    });

    // Update patient timestamp for inbox sorting
    await this.patientRepository.update(patientId, {
      updatedAt: new Date(),
    });

    // Socket notify inbox of updates
    if (ioInstance) {
      ioInstance.emit('new_message', {
        id: convRecord.id,
        patientId: convRecord.patientId,
        message: convRecord.message,
        sender: convRecord.sender,
        messageType: convRecord.messageType,
        deliveryStatus: convRecord.deliveryStatus,
        timestamp: convRecord.timestamp,
      });
    }

    return convRecord;
  }
}
export default ConversationService;
