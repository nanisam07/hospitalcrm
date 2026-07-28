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

  // ==========================
  // VERIFY WEBHOOK
  // ==========================
  verify = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const mode = req.query['hub.mode'];
      const token = req.query['hub.verify_token'];
      const challenge = req.query['hub.challenge'];

      const configuredVerifyToken =
        process.env.WHATSAPP_VERIFY_TOKEN || 'mock-verify-token';

      logger.info('Webhook verification request received');
      logger.info('===== VERIFY REQUEST =====');
logger.info(JSON.stringify(req.query, null, 2));
logger.info(`Mode: ${mode}`);
logger.info(`Token: ${token}`);
logger.info(`Challenge: ${challenge}`);
logger.info('==========================');

      if (mode && token) {
        if (
          mode === 'subscribe' &&
          token === configuredVerifyToken
        ) {
          logger.info('WhatsApp webhook verified successfully.');
          res.status(200).send(challenge);
          return;
        }

        logger.warn('Webhook verification failed.');
        res.status(403).json({
          success: false,
          message: 'Verification failed',
        });
        return;
      }

      res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
      });
    } catch (error) {
      next(error);
    }
  };

  // ==========================
  // RECEIVE WHATSAPP MESSAGE
  // ==========================
  receive = async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      logger.info('==============================');
      logger.info('WHATSAPP WEBHOOK RECEIVED');
      logger.info(JSON.stringify(req.body, null, 2));
      logger.info('==============================');

      let phone = '';
      let message = '';
      let messageType = 'TEXT';
      let latitude: number | undefined;
      let longitude: number | undefined;

      const isMetaWebhook =
        req.body.object === 'whatsapp_business_account';

      logger.info(`Is Meta Webhook: ${isMetaWebhook}`);

      if (isMetaWebhook) {
        const entry = req.body.entry?.[0];
        const change = entry?.changes?.[0];
        const value = change?.value;
        const msg = value?.messages?.[0];

        if (!msg) {
          const statuses = value?.statuses;
          if (statuses && statuses.length > 0) {
            logger.info('========= WHATSAPP STATUS UPDATE =========');
            logger.info(JSON.stringify(statuses, null, 2));
            
            statuses.forEach((s: any) => {
              if (s.errors && s.errors.length > 0) {
                logger.error(`❌ Delivery failed for Message ID: ${s.id}`);
                logger.error(`Recipient: ${s.recipient_id} | Status: ${s.status}`);
                logger.error(`Errors: ${JSON.stringify(s.errors, null, 2)}`);
              } else {
                logger.info(`ℹ️ Message ID: ${s.id} status changed to [${s.status.toUpperCase()}] for recipient: ${s.recipient_id}`);
              }
            });
            logger.info('==========================================');
          } else {
            logger.info('Received status update only.');
          }

          res.status(200).json({
            success: true,
            message: 'Status update acknowledged',
          });
          return;
        }

        phone = '+' + msg.from;
        messageType = msg.type
          ? msg.type.toUpperCase()
          : 'TEXT';

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
        const validated = webhookMessageSchema.parse(req.body);

        phone = validated.phone;
        message = validated.message;
        messageType = validated.messageType;
        latitude = validated.latitude;
        longitude = validated.longitude;
      }

      logger.info(`Phone: ${phone}`);
      logger.info(`Message: ${message}`);
      logger.info(`Type: ${messageType}`);

      logger.info('Calling ChatbotService...');

      const botResponse =
        await this.chatbotService.handleIncomingMessage(
          phone,
          message,
          messageType as any,
          latitude && longitude
            ? {
                latitude,
                longitude,
              }
            : undefined
        );

      logger.info('Chatbot Response:');
      logger.info(botResponse);

      ApiResponse.success(
        res,
        { botResponse },
        'Message processed successfully'
      );
    } catch (error: any) {
      logger.error('Webhook Error');
      logger.error(error);
      next(error);
    }
  };
}

export default WebhookController;