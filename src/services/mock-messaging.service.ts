import { IMessagingService } from '../interfaces/messaging.interface';
import logger from '../config/logger';

export class MockMessagingService implements IMessagingService {
  async sendText(to: string, text: string): Promise<boolean> {
    logger.info(`[MOCK MESSAGE] [TEXT] Sent to: ${to} | Message: "${text}"`);
    return true;
  }

  async sendTemplate(to: string, templateName: string, languageCode: string, components?: any[]): Promise<boolean> {
    logger.info(
      `[MOCK MESSAGE] [TEMPLATE] Sent to: ${to} | Template: "${templateName}" | Language: "${languageCode}" | Components: ${JSON.stringify(
        components || []
      )}`
    );
    return true;
  }

  async sendLocation(to: string, latitude: number, longitude: number, name?: string, address?: string): Promise<boolean> {
    logger.info(
      `[MOCK MESSAGE] [LOCATION] Sent to: ${to} | Coordinates: [Lat: ${latitude}, Lng: ${longitude}] | Name: "${
        name || 'N/A'
      }" | Address: "${address || 'N/A'}"`
    );
    return true;
  }

  async sendImage(to: string, imageUrl: string, caption?: string): Promise<boolean> {
    logger.info(`[MOCK MESSAGE] [IMAGE] Sent to: ${to} | URL: ${imageUrl} | Caption: "${caption || ''}"`);
    return true;
  }
}
