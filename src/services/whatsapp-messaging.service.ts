import axios from "axios";
import { IMessagingService } from "../interfaces/messaging.interface";
import logger from "../config/logger";

export class WhatsAppMessagingService implements IMessagingService {
  private accessToken: string;
  private phoneNumberId: string;
  private apiVersion: string;

  constructor() {
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || "";
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
    this.apiVersion = process.env.WHATSAPP_API_VERSION || "v25.0";
  }

  private async makeApiCall(
    endpoint: string,
    payload: any
  ): Promise<boolean> {
    const url = `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/${endpoint}`;
    logger.info(`Meta Request URL: ${url}`);
    logger.info(`Meta Payload: ${JSON.stringify(payload, null, 2)}`);

    try {
      const response = await axios.post(url, payload, {
        headers: {
          Authorization: `Bearer ${this.accessToken}`,
          "Content-Type": "application/json",
        },
      });

      logger.info(`Meta Response: ${JSON.stringify(response.data, null, 2)}`);
      return response.status === 200 || response.status === 201;
    } catch (error: any) {
      const status = error.response?.status || 500;
      const errorData = error.response?.data || { message: error.message };

      logger.error(`Meta Error [Status ${status}]: ${JSON.stringify(errorData, null, 2)}`);
      logger.error(error.stack || error);

      const metaMsg = errorData?.error?.message || error.message || "Meta API request failed";
      const err: any = new Error(`Meta WhatsApp API Error [${status}]: ${metaMsg}`);
      err.status = status;
      err.metaData = errorData;
      throw err;
    }
  }

  async sendText(to: string, text: string): Promise<boolean> {
    const cleanPhone = to.replace(/\D/g, "");

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanPhone,
      type: "text",
      text: {
        preview_url: false,
        body: text,
      },
    };

    console.log("================================");
    console.log("Sending WhatsApp reply...");
    console.log("To:", cleanPhone);
    console.log("Message:", text);
    console.log(JSON.stringify(payload, null, 2));
    console.log("================================");

    return this.makeApiCall("messages", payload);
  }

  async sendTemplate(
    to: string,
    templateName: string,
    languageCode: string,
    components?: any[]
  ): Promise<boolean> {
    const cleanPhone = to.replace(/\D/g, "");

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanPhone,
      type: "template",
      template: {
        name: templateName,
        language: {
          code: languageCode,
        },
        components,
      },
    };

    return this.makeApiCall("messages", payload);
  }

  async sendLocation(
    to: string,
    latitude: number,
    longitude: number,
    name?: string,
    address?: string
  ): Promise<boolean> {
    const cleanPhone = to.replace(/\D/g, "");

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanPhone,
      type: "location",
      location: {
        latitude,
        longitude,
        name: name || "Location",
        address: address || "Details",
      },
    };

    return this.makeApiCall("messages", payload);
  }

  async sendImage(
    to: string,
    imageUrl: string,
    caption?: string
  ): Promise<boolean> {
    const cleanPhone = to.replace(/\D/g, "");

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: cleanPhone,
      type: "image",
      image: {
        link: imageUrl,
        caption: caption || "",
      },
    };

    return this.makeApiCall("messages", payload);
  }
}

export default WhatsAppMessagingService;