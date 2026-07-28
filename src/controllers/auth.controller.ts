import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service';
import { loginSchema, registerSchema } from '../validators/auth.validator';
import { ApiResponse } from '../utils/api-response';
import { AuthenticatedRequest } from '../middlewares/auth.middleware';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = loginSchema.parse(req.body);
      const result = await this.authService.login(validatedBody);
      ApiResponse.success(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  };

  register = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = registerSchema.parse(req.body);
      const actorId = req.user?.id || 'SYSTEM';
      const actorRole = req.user?.role || 'ADMIN';

      const result = await this.authService.register(validatedBody, actorId, actorRole);
      ApiResponse.success(res, result, 'User registered successfully', 201);
    } catch (error) {
      next(error);
    }
  };

  me = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponse.error(res, 'Not authenticated', 401);
        return;
      }
      ApiResponse.success(res, req.user, 'Current user profile');
    } catch (error) {
      next(error);
    }
  };
}
export default AuthController;
