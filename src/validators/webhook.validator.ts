import { z } from 'zod';
import { MessageType } from '@prisma/client';

export const webhookMessageSchema = z.object({
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format'),
  message: z.string().default(''),
  messageType: z.nativeEnum(MessageType).optional().default(MessageType.TEXT),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
});

export type WebhookMessageDto = z.infer<typeof webhookMessageSchema>;
export default webhookMessageSchema;
