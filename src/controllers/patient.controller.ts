import { Response, NextFunction } from 'express';
import { PatientService } from '../services/patient.service';
import { createPatientSchema, updatePatientSchema, patientQuerySchema } from '../validators/patient.validator';
import { ApiResponse } from '../utils/api-response';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class PatientController {
  private patientService: PatientService;

  constructor() {
    this.patientService = new PatientService();
  }

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = createPatientSchema.parse(req.body);
      const actorId = req.user?.id || 'SYSTEM';
      const actorRole = req.user?.role || 'ADMIN';

      const result = await this.patientService.createPatient(validatedBody, actorId, actorRole);
      ApiResponse.success(res, result, 'Patient created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.patientService.getPatientById(id);
      if (!result) {
        ApiResponse.error(res, 'Patient not found', 404);
        return;
      }
      ApiResponse.success(res, result, 'Patient retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validatedBody = updatePatientSchema.parse(req.body);
      const actorId = req.user?.id || 'SYSTEM';
      const actorRole = req.user?.role || 'ADMIN';

      const result = await this.patientService.updatePatient(id, validatedBody, actorId, actorRole);
      ApiResponse.success(res, result, 'Patient updated successfully');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const actorId = req.user?.id || 'SYSTEM';
      const actorRole = req.user?.role || 'ADMIN';

      const result = await this.patientService.deletePatient(id, actorId, actorRole);
      ApiResponse.success(res, result, 'Patient deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = patientQuerySchema.parse(req.query);
      const skip = (query.page - 1) * query.limit;

      const { data, total } = await this.patientService.getAllPatients({
        search: query.search,
        skip,
        take: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

      ApiResponse.paginate(res, data, total, query.page, query.limit, 'Patients retrieved successfully');
    } catch (error) {
      next(error);
    }
  };
}
export default PatientController;
