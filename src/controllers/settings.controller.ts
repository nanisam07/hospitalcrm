import { Response, NextFunction } from 'express';
import { SettingsService } from '../services/settings.service';
import { updateSettingsSchema } from '../validators/settings.validator';
import { ApiResponse } from '../utils/api-response';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class SettingsController {
  private settingsService: SettingsService;

  constructor() {
    this.settingsService = new SettingsService();
  }

  get = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.settingsService.getSettings();
      ApiResponse.success(res, result, 'Hospital settings retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = updateSettingsSchema.parse(req.body);
      const actorId = req.user?.id || 'SYSTEM';
      const actorRole = req.user?.role || 'ADMIN';

      const result = await this.settingsService.updateSettings(validatedBody, actorId, actorRole);
      ApiResponse.success(res, result, 'Hospital settings updated successfully');
    } catch (error) {
      next(error);
    }
  };
}
export default SettingsController;
