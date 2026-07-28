export interface IMessagingService {
  sendText(to: string, text: string): Promise<boolean>;
  sendTemplate(to: string, templateName: string, languageCode: string, components?: any[]): Promise<boolean>;
  sendLocation(to: string, latitude: number, longitude: number, name?: string, address?: string): Promise<boolean>;
  sendImage(to: string, imageUrl: string, caption?: string): Promise<boolean>;
}
