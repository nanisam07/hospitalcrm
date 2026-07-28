import { IMessagingService } from '../interfaces/messaging.interface';
import { MockMessagingService } from './mock-messaging.service';
import { WhatsAppMessagingService } from './whatsapp-messaging.service';
import logger from '../config/logger';

export class MessagingServiceFactory {
  private static instance: IMessagingService;

  static getService(): IMessagingService {
    if (!this.instance) {
      const provider = (process.env.MESSAGE_PROVIDER || 'mock').toLowerCase();
      logger.info(`Initializing Messaging Service. Provider selected: [${provider.toUpperCase()}]`);

      if (provider === 'whatsapp') {
        this.instance = new WhatsAppMessagingService();
      } else {
        this.instance = new MockMessagingService();
      }
    }
    return this.instance;
  }
}
export default MessagingServiceFactory;
