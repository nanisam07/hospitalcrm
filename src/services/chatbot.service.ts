import { SessionRepository } from '../repositories/session.repository';
import { PatientRepository } from '../repositories/patient.repository';
import { AppointmentRepository } from '../repositories/appointment.repository';
import { ConversationRepository } from '../repositories/conversation.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { MessagingServiceFactory } from './messaging.factory';
import { SenderType, MessageType, DeliveryStatus, AppointmentStatus } from '@prisma/client';
import logger from '../config/logger';

// Real-time notification socket event trigger wrapper (will be initialized in server.ts)
let ioInstance: any = null;
export const setSocketIoInstance = (io: any) => {
  ioInstance = io;
};

const DEPARTMENTS = [
  'General Physician',
  'ENT',
  'Orthopedic',
  'Cardiology',
  'Neurology',
  'Dermatology',
  'Pediatrics',
  'Gynecology',
  'Dental',
  'Ophthalmology (Eye)',
  'Pulmonology',
  'Urology',
  'Psychiatry',
  'Gastroenterology'
];

export class ChatbotService {
  private sessionRepository: SessionRepository;
  private patientRepository: PatientRepository;
  private appointmentRepository: AppointmentRepository;
  private conversationRepository: ConversationRepository;
  private auditRepository: AuditRepository;

  constructor() {
    this.sessionRepository = new SessionRepository();
    this.patientRepository = new PatientRepository();
    this.appointmentRepository = new AppointmentRepository();
    this.conversationRepository = new ConversationRepository();
    this.auditRepository = new AuditRepository();
  }

  async handleIncomingMessage(phone: string, text: string, type: MessageType = MessageType.TEXT, locationData?: { latitude: number; longitude: number }): Promise<string> {
    const cleanText = text.trim();
    logger.info(`Chatbot processing message from ${phone}: "${cleanText}" [Type: ${type}]`);

    // 1. Resolve Patient (if already created, we use their name/records, but we still ask chatbot inputs for new appointments)
    let patient = await this.patientRepository.findByPhone(phone);

    // Save Patient message to Conversation history
    if (patient) {
      await this.conversationRepository.create({
        patientId: patient.id,
        message: type === MessageType.LOCATION ? `Location: ${locationData?.latitude}, ${locationData?.longitude}` : cleanText,
        sender: SenderType.PATIENT,
        messageType: type,
        deliveryStatus: DeliveryStatus.READ,
      });
    }

    // 2. Fetch or create chat session
    let session = await this.sessionRepository.findByPhone(phone);
    if (!session) {
      session = await this.sessionRepository.create(phone, 'START', {});
    }

    let responseMessage = '';
    const sessionData = (session.data as any) || {};

    switch (session.step) {
      case 'START':
        sessionData.phone = phone;
        await this.sessionRepository.update(phone, 'AWAITING_NAME', sessionData);
        responseMessage = `Welcome to Linelekunda Hospital Booking Bot! 😊\n\nMay I know your full name?`;
        break;

      case 'AWAITING_NAME':
        if (!cleanText || cleanText.length < 2) {
          responseMessage = `Please provide a valid name to proceed:`;
        } else {
          sessionData.fullName = cleanText;
          await this.sessionRepository.update(phone, 'AWAITING_DEPARTMENT', sessionData);
          responseMessage = `Nice to meet you, ${cleanText}! What department do you need?\n\nAvailable Departments:\n${DEPARTMENTS.map((d, i) => `${i + 1}. ${d}`).join('\n')}\n\n(Type the department name or number)`;
        }
        break;

      case 'AWAITING_DEPARTMENT':
        let selectedDept = '';
        const deptNum = parseInt(cleanText, 10);
        if (!isNaN(deptNum) && deptNum >= 1 && deptNum <= DEPARTMENTS.length) {
          selectedDept = DEPARTMENTS[deptNum - 1];
        } else {
          // Check string similarity (direct case insensitive match)
          const found = DEPARTMENTS.find(d => d.toLowerCase() === cleanText.toLowerCase());
          if (found) {
            selectedDept = found;
          }
        }

        if (!selectedDept) {
          responseMessage = `Invalid department. Please type the exact name or number from the list:\n\n${DEPARTMENTS.map((d, i) => `${i + 1}. ${d}`).join('\n')}`;
        } else {
          sessionData.department = selectedDept;
          await this.sessionRepository.update(phone, 'AWAITING_REASON', sessionData);
          responseMessage = `Understood. What is the reason for your visit/consultation in ${selectedDept}?`;
        }
        break;

      case 'AWAITING_REASON':
        if (!cleanText || cleanText.length < 3) {
          responseMessage = `Please provide a brief reason for your appointment:`;
        } else {
          sessionData.reason = cleanText;
          await this.sessionRepository.update(phone, 'AWAITING_DATE', sessionData);
          responseMessage = `Got it. What is your preferred date for the appointment? (Format: YYYY-MM-DD or say "Tomorrow", "Today")`;
        }
        break;

      case 'AWAITING_DATE':
        let targetDate: Date | null = null;
        if (cleanText.toLowerCase() === 'today') {
          targetDate = new Date();
        } else if (cleanText.toLowerCase() === 'tomorrow') {
          targetDate = new Date();
          targetDate.setDate(targetDate.getDate() + 1);
        } else {
          const parsed = Date.parse(cleanText);
          if (!isNaN(parsed)) {
            targetDate = new Date(parsed);
          }
        }

        // Validate date is today or in future
        if (!targetDate || isNaN(targetDate.getTime())) {
          responseMessage = `Invalid date format. Please provide a date like YYYY-MM-DD (e.g. 2026-08-01):`;
        } else {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          if (targetDate < today) {
            responseMessage = `Appointments cannot be booked in the past. Please select today or a future date:`;
          } else {
            sessionData.preferredDate = targetDate.toISOString();
            await this.sessionRepository.update(phone, 'AWAITING_TIME', sessionData);
            responseMessage = `Perfect! What is your preferred slot or time? (e.g., "10:00 AM", "Evening slot", "02:30 PM")`;
          }
        }
        break;

      case 'AWAITING_TIME':
        if (!cleanText || cleanText.length < 2) {
          responseMessage = `Please specify a preferred slot/time:`;
        } else {
          sessionData.preferredTime = cleanText;
          await this.sessionRepository.update(phone, 'AWAITING_ADDRESS', sessionData);
          responseMessage = `Thank you. Could you please provide your residential address for our records?`;
        }
        break;

      case 'AWAITING_ADDRESS':
        if (!cleanText || cleanText.length < 5) {
          responseMessage = `Please provide your full address:`;
        } else {
          sessionData.address = cleanText;
          await this.sessionRepository.update(phone, 'AWAITING_LOCATION', sessionData);
          responseMessage = `Lastly, please share your live location via WhatsApp, or type/send "skip" to skip coordinates:`;
        }
        break;

      case 'AWAITING_LOCATION':
        let latitude: number | null = null;
        let longitude: number | null = null;

        if (type === MessageType.LOCATION && locationData) {
          latitude = locationData.latitude;
          longitude = locationData.longitude;
        } else if (cleanText.toLowerCase() !== 'skip') {
          // If typed location coordinates e.g. "28.61, 77.20"
          const coords = cleanText.split(',').map(c => parseFloat(c.trim()));
          if (coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])) {
            latitude = coords[0];
            longitude = coords[1];
          }
        }

        sessionData.latitude = latitude;
        sessionData.longitude = longitude;

        // ALL DETAILS COLLECTED - COMMIT TO DATABASE
        try {
          // 1. Create Patient if not exists
          if (!patient) {
            patient = await this.patientRepository.create({
              fullName: sessionData.fullName,
              phone: phone,
              address: sessionData.address,
              latitude: sessionData.latitude,
              longitude: sessionData.longitude,
            });
            await this.auditRepository.log(
              'BOT',
              'BOT',
              'Patient Created',
              `Patient ${patient.fullName} (${patient.phone}) created via WhatsApp Chatbot.`
            );
          } else {
            // Update patient address & location details
            patient = await this.patientRepository.update(patient.id, {
              address: sessionData.address,
              latitude: sessionData.latitude,
              longitude: sessionData.longitude,
            });
            await this.auditRepository.log(
              'BOT',
              'BOT',
              'Patient Updated',
              `Patient ${patient.fullName} details updated via Chatbot.`
            );
          }

          // 2. Create Appointment (Status = PENDING, DoctorId = null)
          const appointment = await this.appointmentRepository.create({
            patientId: patient.id,
            department: sessionData.department,
            reason: sessionData.reason,
            preferredDate: new Date(sessionData.preferredDate),
            preferredTime: sessionData.preferredTime,
            status: AppointmentStatus.PENDING,
          });

          await this.auditRepository.log(
            'BOT',
            'BOT',
            'Appointment Created',
            `Pending Appointment in ${appointment.department} created for ${patient.fullName}.`
          );

          // Save final BOT message to Conversation log
          responseMessage = `Thank you, ${patient.fullName}! 🎉 Your appointment request has been submitted successfully.\n\n` +
            `Booking Details:\n` +
            `• Department: ${appointment.department}\n` +
            `• Preferred Date: ${new Date(appointment.preferredDate).toLocaleDateString()}\n` +
            `• Preferred Time: ${appointment.preferredTime}\n` +
            `• Status: PENDING\n\n` +
            `Our receptionist will review your request shortly, assign the doctor, and send your confirmation code. Thank you!`;

          await this.conversationRepository.create({
            patientId: patient.id,
            message: responseMessage,
            sender: SenderType.BOT,
            messageType: MessageType.TEXT,
            deliveryStatus: DeliveryStatus.READ,
          });

          // 3. Clear the ChatSession
          await this.sessionRepository.delete(phone);

          // 4. Emit Socket.IO event for real-time dashboard notification
          if (ioInstance) {
            ioInstance.emit('new_appointment', {
              id: appointment.id,
              patient: {
                id: patient.id,
                fullName: patient.fullName,
                phone: patient.phone,
              },
              department: appointment.department,
              reason: appointment.reason,
              preferredDate: appointment.preferredDate,
              preferredTime: appointment.preferredTime,
              status: appointment.status,
            });
            ioInstance.emit('new_message', {
              patientId: patient.id,
              message: responseMessage,
              sender: SenderType.BOT,
              timestamp: new Date(),
            });
            logger.info(`Socket.IO emitted new_appointment for appointment: ${appointment.id}`);
          }
        } catch (error: any) {
          logger.error(`Error saving chatbot appointment: ${error.message}`);
          responseMessage = `We encountered an issue saving your booking. Please try again.`;
        }
        break;
    }

    // Send the bot response using MessagingService
    const messagingService = MessagingServiceFactory.getService();
    await messagingService.sendText(phone, responseMessage);

    // Save BOT message to Conversation history
    if (patient && session.step !== 'AWAITING_LOCATION') {
      await this.conversationRepository.create({
        patientId: patient.id,
        message: responseMessage,
        sender: SenderType.BOT,
        messageType: MessageType.TEXT,
        deliveryStatus: DeliveryStatus.READ,
      });
    }

    return responseMessage;
  }
}
export default ChatbotService;
