import { Response, NextFunction } from 'express';
import { DoctorService } from '../services/doctor.service';
import { createDoctorSchema, updateDoctorSchema, doctorQuerySchema } from '../validators/doctor.validator';
import { ApiResponse } from '../utils/api-response';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class DoctorController {
  private doctorService: DoctorService;

  constructor() {
    this.doctorService = new DoctorService();
  }

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = createDoctorSchema.parse(req.body);
      const actorId = req.user?.id || 'SYSTEM';
      const actorRole = req.user?.role || 'ADMIN';

      const result = await this.doctorService.createDoctor(validatedBody, actorId, actorRole);
      ApiResponse.success(res, result, 'Doctor created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.doctorService.getDoctorById(id);
      if (!result) {
        ApiResponse.error(res, 'Doctor not found', 404);
        return;
      }
      ApiResponse.success(res, result, 'Doctor retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validatedBody = updateDoctorSchema.parse(req.body);
      const actorId = req.user?.id || 'SYSTEM';
      const actorRole = req.user?.role || 'ADMIN';

      const result = await this.doctorService.updateDoctor(id, validatedBody, actorId, actorRole);
      ApiResponse.success(res, result, 'Doctor updated successfully');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const actorId = req.user?.id || 'SYSTEM';
      const actorRole = req.user?.role || 'ADMIN';

      const result = await this.doctorService.deleteDoctor(id, actorId, actorRole);
      ApiResponse.success(res, result, 'Doctor deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = doctorQuerySchema.parse(req.query);
      const skip = (query.page - 1) * query.limit;

      const { data, total } = await this.doctorService.getAllDoctors({
        search: query.search,
        department: query.department,
        skip,
        take: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

      ApiResponse.paginate(res, data, total, query.page, query.limit, 'Doctors retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}
export default DoctorController;
