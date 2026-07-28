import { Response, NextFunction } from 'express';
import { AppointmentService } from '../services/appointment.service';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  assignDoctorSchema,
  updateStatusSchema,
  appointmentQuerySchema,
} from '../validators/appointment.validator';
import { ApiResponse } from '../utils/api-response';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class AppointmentController {
  private appointmentService: AppointmentService;

  constructor() {
    this.appointmentService = new AppointmentService();
  }

  create = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = createAppointmentSchema.parse(req.body);
      const actorId = req.user?.id || 'SYSTEM';
      const actorRole = req.user?.role || 'ADMIN';

      const result = await this.appointmentService.createAppointment(validatedBody, actorId, actorRole);
      ApiResponse.success(res, result, 'Appointment created successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  getById = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const result = await this.appointmentService.getAppointmentById(id);
      if (!result) {
        ApiResponse.error(res, 'Appointment not found', 404);
        return;
      }
      ApiResponse.success(res, result, 'Appointment retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  update = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const validatedBody = updateAppointmentSchema.parse(req.body);
      const actorId = req.user?.id || 'SYSTEM';
      const actorRole = req.user?.role || 'ADMIN';

      const result = await this.appointmentService.updateAppointment(id, validatedBody, actorId, actorRole);
      ApiResponse.success(res, result, 'Appointment updated successfully');
    } catch (error) {
      next(error);
    }
  };

  delete = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const actorId = req.user?.id || 'SYSTEM';
      const actorRole = req.user?.role || 'ADMIN';

      const result = await this.appointmentService.deleteAppointment(id, actorId, actorRole);
      ApiResponse.success(res, result, 'Appointment deleted successfully');
    } catch (error) {
      next(error);
    }
  };

  list = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const query = appointmentQuerySchema.parse(req.query);
      const skip = (query.page - 1) * query.limit;

      const { data, total } = await this.appointmentService.getAllAppointments({
        search: query.search,
        status: query.status,
        department: query.department,
        doctorId: query.doctorId,
        dateStart: query.dateStart,
        dateEnd: query.dateEnd,
        skip,
        take: query.limit,
        sortBy: query.sortBy,
        sortOrder: query.sortOrder,
      });

      ApiResponse.paginate(res, data, total, query.page, query.limit, 'Appointments retrieved successfully');
    } catch (error) {
      next(error);
    }
  };

  assignDoctor = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { doctorId } = assignDoctorSchema.parse(req.body);
      const actorId = req.user?.id || 'SYSTEM';
      const actorRole = req.user?.role || 'ADMIN';

      const result = await this.appointmentService.assignDoctorAndConfirm(id, doctorId, actorId, actorRole);
      ApiResponse.success(res, result, 'Doctor assigned and appointment confirmed successfully');
    } catch (error) {
      next(error);
    }
  };

  updateStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { id } = req.params;
      const { status } = updateStatusSchema.parse(req.body);
      const actorId = req.user?.id || 'SYSTEM';
      const actorRole = req.user?.role || 'ADMIN';

      const result = await this.appointmentService.updateAppointmentStatus(id, status, actorId, actorRole);
      ApiResponse.success(res, result, `Appointment status updated to ${status} successfully`);
    } catch (error) {
      next(error);
    }
  };
}
export default AppointmentController;
