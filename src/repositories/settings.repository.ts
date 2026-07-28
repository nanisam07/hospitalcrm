import { Prisma, HospitalSettings } from '@prisma/client';
import prisma from '../config/db';

export class SettingsRepository {
  async getSettings(): Promise<HospitalSettings | null> {
    return prisma.hospitalSettings.findUnique({
      where: { id: 1 },
    });
  }

  async updateSettings(data: Prisma.HospitalSettingsUpdateInput): Promise<HospitalSettings> {
    return prisma.hospitalSettings.upsert({
      where: { id: 1 },
      update: data,
      create: {
        id: 1,
        hospitalName: (data.hospitalName as string) || 'Default Hospital Name',
        phone: (data.phone as string) || '+919999999999',
        emergencyNumber: (data.emergencyNumber as string) || '+919999999999',
        email: (data.email as string) || 'info@hospital.com',
        address: (data.address as string) || 'Default Address',
        googleMapsLink: (data.googleMapsLink as string) || 'https://maps.google.com',
        openingTime: (data.openingTime as string) || '08:00',
        closingTime: (data.closingTime as string) || '20:00',
      },
    });
  }
}
