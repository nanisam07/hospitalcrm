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
  ): 
  
  Promise<boolean> {
    logger.info("############################");
    logger.info("SAMUEL BUILD 999999");
    logger.info("############################");
    try {
      console.log("========================================");
      console.log("Calling Meta WhatsApp API...");
      console.log(
        `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/${endpoint}`
      );
      console.log("========================================");

      const response = await axios.post(
        `https://graph.facebook.com/${this.apiVersion}/${this.phoneNumberId}/${endpoint}`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      logger.info("=========== META RESPONSE ===========");
      logger.info(JSON.stringify(response.data, null, 2));
      logger.info("=====================================");

      logger.info("build 123456");

      return response.status === 200 || response.status === 201;
    } catch (error: any) {
      console.log("========== WHATSAPP ERROR ==========");
      console.log("Status:", error.response?.status);
      console.log(
        "Data:",
        JSON.stringify(error.response?.data, null, 2)
      );
      console.log("Message:", error.message);
      console.log("====================================");

      return false;
    }
  }

  async sendText(to: string, text: string): Promise<boolean> {
    const cleanPhone = to.replace(/\D/g, "");

    const payload = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to.replace("+", ""),
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