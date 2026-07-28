import { Request, Response, NextFunction } from 'express';
import { ChatbotService } from '../services/chatbot.service';
import { webhookMessageSchema } from '../validators/webhook.validator';
import { ApiResponse } from '../utils/api-response';
import logger from '../config/logger';

export class WebhookController {
  private chatbotService: ChatbotService;

  constructor() {
    this.chatbotService = new ChatbotService();
  }

  // GET: Validate WhatsApp Webhook (Meta Verification)
  verify = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      const configuredVerifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'mock-verify-token';

      if (mode && token) {
        if (mode === 'subscribe' && token === configuredVerifyToken) {
          logger.info('WhatsApp webhook successfully verified.');
          res.status(200).send(challenge);
          return;
        } else {
          logger.warn('WhatsApp webhook verification failed. Token mismatch.');
          res.status(403).json({ success: false, message: 'Verification failed' });
          return;
        }
      }
      res.status(400).json({ success: false, message: 'Invalid query parameters' });
      return;
    } catch (error) {
      next(error);
    }
  };

  // POST: Receive Simulated or Real incoming WhatsApp message
  receive = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

  console.log("======================================");
  console.log("🔥 WHATSAPP WEBHOOK RECEIVED");
  console.log(JSON.stringify(req.body, null, 2));
  console.log("======================================");

  try {
      // 1. Meta Webhook formats vs simulation payloads
      // If it is a real webhook from Meta, it comes as nested object structure:
      // entry[0].changes[0].value.messages[0]
      let phone = '';
      let message = '';
      let messageType = 'TEXT';
      let latitude: number | undefined;
      let longitude: number | undefined;

      const isMetaWebhook = req.body.object === 'whatsapp_business_account';

      if (isMetaWebhook) {
        logger.info('Received WhatsApp message from Meta Cloud API webhook.');
        const entry = req.body.entry?.[0];
        const change = entry?.changes?.[0];
        const value = change?.value;
        const msg = value?.messages?.[0];

        if (!msg) {
          // If message status update payload, just acknowledge
          res.status(200).json({ success: true, message: 'Status update acknowledged' });
          return;
        }

        phone = '+' + msg.from; // Meta sends without + symbol prefix
        messageType = msg.type ? msg.type.toUpperCase() : 'TEXT';

        if (msg.type === 'text') {
          message = msg.text?.body || '';
        } else if (msg.type === 'location') {
          latitude = msg.location?.latitude;
          longitude = msg.location?.longitude;
          message = 'Location shared';
        } else {
          message = `Shared a ${msg.type}`;
        }
      } else {
        // Fallback to our REST simulation JSON payload
        const validated = webhookMessageSchema.parse(req.body);
        phone = validated.phone;
        message = validated.message;
        messageType = validated.messageType;
        latitude = validated.latitude;
        longitude = validated.longitude;
      }

      // Handle message in Chatbot State Machine
      const botResponse = await this.chatbotService.handleIncomingMessage(
        phone,
        message,
        messageType as any,
        latitude && longitude ? { latitude, longitude } : undefined
      );

      ApiResponse.success(
        res,
        { botResponse },
        'Message received and processed by chatbot'
      );
    } catch (error) {
      next(error);
    }
  };
}
export default WebhookController;
