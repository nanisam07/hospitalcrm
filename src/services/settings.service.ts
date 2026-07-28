import { SettingsRepository } from '../repositories/settings.repository';
import { AuditRepository } from '../repositories/audit.repository';
import { HospitalSettings, Prisma } from '@prisma/client';

export class SettingsService {
  private settingsRepository: SettingsRepository;
  private auditRepository: AuditRepository;

  constructor() {
    this.settingsRepository = new SettingsRepository();
    this.auditRepository = new AuditRepository();
  }

  async getSettings(): Promise<HospitalSettings | null> {
    return this.settingsRepository.getSettings();
  }

  async updateSettings(data: Prisma.HospitalSettingsUpdateInput, actorId: string, actorRole: string): Promise<HospitalSettings> {
    const settings = await this.settingsRepository.updateSettings(data);
    await this.auditRepository.log(
      actorId,
      actorRole,
      'Settings Changed',
      `Hospital Profile Settings updated by ${actorId}.`
    );
    return settings;
  }
}
export default SettingsService;
