import { IMessagingService } from '../interfaces/messaging.interface';
import logger from '../config/logger';

export class WhatsAppMessagingService implements IMessagingService {
  private accessToken: string;
  private phoneNumberId: string;
  private apiVersion: string;

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || '';
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || '';
    this.apiVersion = process.env.WHATSAPP_API_VERSION || 'v18.0';
  }

  private async makeApiCall(endpoint: string, payload: any): Promise<boolean> {
    logger.info(
      `[WHATSAPP MESSAGE INITIATED] [API Calling: https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/${endpoint}] | Token Length: ${this.accessToken.length}`
    );
    logger.debug(`[WHATSAPP MESSAGE PAYLOAD]: ${JSON.stringify(payload)}`);

    // In a real implementation:
    // try {
    //   const response = await axios.post(
    //     `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/${endpoint}`,
    //     payload,
    //     { headers: { Authorization: `Bearer ${this.accessToken}`, 'Content-Type': 'application/json' } }
    //   );
    //   return response.status === 200 || response.status === 201;
    // } catch (error) {
    //   logger.error(`[WHATSAPP MESSAGE ERROR]: ${error}`);
    //   return false;
    // }

    logger.info('[WHATSAPP MESSAGE MOCKED SUCCESS] Credentials not live, logged successfully.');
    return true;
  }

  async sendText(to: string, text: string): Promise<boolean> {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'text',
      text: { preview_url: false, body: text },
    };
    return this.makeApiCall('messages', payload);
  }

  async sendTemplate(to: string, templateName: string, languageCode: string, components?: any[]): Promise<boolean> {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'template',
      template: {
        name: templateName,
        language: { code: languageCode },
        components,
      },
    };
    return this.makeApiCall('messages', payload);
  }

  async sendLocation(to: string, latitude: number, longitude: number, name?: string, address?: string): Promise<boolean> {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'location',
      location: {
        latitude,
        longitude,
        name: name || 'Location',
        address: address || 'Details',
      },
    };
    return this.makeApiCall('messages', payload);
  }

  async sendImage(to: string, imageUrl: string, caption?: string): Promise<boolean> {
    const payload = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to,
      type: 'image',
      image: {
        link: imageUrl,
        caption: caption || '',
      },
    };
    return this.makeApiCall('messages', payload);
  }
}
export default WhatsAppMessagingService;
