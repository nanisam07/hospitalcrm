import { Response, NextFunction } from 'express';
import { ConversationService } from '../services/conversation.service';
import { ApiResponse } from '../utils/api-response';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';
import { SenderType, MessageType } from '@prisma/client';
import { z } from 'zod';

const sendMessageSchema = z.object({
  patientId: z.string().uuid('Invalid Patient ID'),
  message: z.string().min(1, 'Message content cannot be empty'),
  messageType: z.nativeEnum(MessageType).optional().default(MessageType.TEXT),
});

export class ConversationController {
  private conversationService: ConversationService;

  constructor() {
    this.conversationService = new ConversationService();
  }

  getInbox = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const inbox = await this.conversationService.getInbox({ skip, take: limit });
      ApiResponse.success(res, inbox, 'Inbox threads retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getHistory = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId } = req.params;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = (page - 1) * limit;

      const { data, total } = await this.conversationService.getHistoryByPatientId(patientId, { skip, take: limit });
      ApiResponse.paginate(res, data, total, page, limit, 'Conversation history retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  sendMessage = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { patientId, message, messageType } = sendMessageSchema.parse(req.body);
      const actorId = req.user?.id || 'SYSTEM';

      const result = await this.conversationService.sendManualMessage(
        patientId,
        message,
        SenderType.DOCTOR, // Standard dashboard reply sender
        messageType,
        actorId
      );

      ApiResponse.success(res, result, 'Message sent successfully', 201);
    } catch (error) {
      next(error);
    }
  };
}
export default ConversationController;
