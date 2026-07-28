import { Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service';
import { ApiResponse } from '../utils/api-response';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class DashboardController {
  private dashboardService: DashboardService;

  constructor() {
    this.dashboardService = new DashboardService();
  }

  getStats = async (_req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const stats = await this.dashboardService.getMetrics();
      ApiResponse.success(res, stats, 'Dashboard metrics retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  getReports = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const days = parseInt(req.query.days as string) || 7;
      const reports = await this.dashboardService.getReports(days);
      ApiResponse.success(res, reports, `Reports for the last ${days} days retrieved successfully`);
    } catch (error) {
      next(error);
    }
  };

  getAuditLogs = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const skip = (page - 1) * limit;

      const { data, total } = await this.dashboardService.getAuditLogs({ skip, take: limit });
      ApiResponse.paginate(res, data, total, page, limit, 'System audit logs retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}
export default DashboardController;
