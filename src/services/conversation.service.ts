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
    logger.info('---------------------------------');
    logger.info('Entering sendManualMessage()');

    try {
      const patient = await this.patientRepository.findById(patientId);
      if (!patient) {
        throw new Error(`Patient not found with ID: ${patientId}`);
      }

      logger.info('Calling Meta WhatsApp API...');
      const messagingService = MessagingServiceFactory.getService();

      let sent = false;
      try {
        if (messageType === MessageType.TEXT) {
          sent = await messagingService.sendText(patient.phone, message);
        } else {
          sent = await messagingService.sendText(patient.phone, message);
        }
      } catch (messagingError: any) {
        logger.error(`Meta Error during manual send: ${messagingError.message}`);
        logger.error(messagingError.stack || messagingError);

        // Store failed conversation record for audit history
        await this.conversationRepository.create({
          patientId,
          message,
          sender,
          messageType,
          deliveryStatus: DeliveryStatus.FAILED,
        });

        // TASK 5: Never return HTTP 201 if WhatsApp sending fails. Throw error!
        throw messagingError;
      }

      if (!sent) {
        await this.conversationRepository.create({
          patientId,
          message,
          sender,
          messageType,
          deliveryStatus: DeliveryStatus.FAILED,
        });
        throw new Error(`WhatsApp API failed to deliver message to ${patient.phone}`);
      }

      logger.info('Saving conversation...');
      const convRecord = await this.conversationRepository.create({
        patientId,
        message,
        sender,
        messageType,
        deliveryStatus: DeliveryStatus.DELIVERED,
      });
      logger.info(`Conversation saved. ID: ${convRecord.id}`);

      // Update patient timestamp for inbox sorting
      await this.patientRepository.update(patientId, {
        updatedAt: new Date(),
      });

      logger.info('Socket.IO emit...');
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

      logger.info('Completed successfully.');
      logger.info('---------------------------------');

      return convRecord;
    } catch (error: any) {
      logger.error('Failed in sendManualMessage():');
      logger.error(error.stack || error);
      logger.info('---------------------------------');
      throw error;
    }
  }

  /**
   * Store an incoming patient message without triggering the chatbot.
   * Used when CHATBOT_ENABLED=false so the dashboard still receives
   * all patient messages in real time via Socket.IO.
   */
  async storeIncomingMessage(
    phone: string,
    message: string,
    messageType: MessageType = MessageType.TEXT
  ): Promise<void> {
    const patient = await this.patientRepository.findByPhone(phone);
    if (!patient) {
      logger.warn(`storeIncomingMessage: No patient found for phone ${phone}. Message not stored.`);
      return;
    }

    const convRecord = await this.conversationRepository.create({
      patientId: patient.id,
      message,
      sender: SenderType.PATIENT,
      messageType,
      deliveryStatus: DeliveryStatus.READ,
    });

    // Update patient timestamp so inbox sorts correctly
    await this.patientRepository.update(patient.id, { updatedAt: new Date() });

    // Notify dashboard in real time
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

    logger.info(`[CHATBOT_DISABLED] Stored incoming message from ${phone} (patientId: ${patient.id})`);
  }
}
export default ConversationService;
