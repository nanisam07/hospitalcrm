import { Response } from 'express';

export class ApiResponse {
  static success(res: Response, data: any, message: string = 'Success', status: number = 200) {
    return res.status(status).json({
      success: true,
      message,
      data,
    });
  }

  static paginate(
    res: Response,
    data: any[],
    total: number,
    page: number,
    limit: number,
    message: string = 'Success'
  ) {
    const pages = Math.ceil(total / limit);
    return res.status(200).json({
      success: true,
      message,
      data,
      pagination: {
        total,
        page,
        limit,
        pages,
        hasNext: page < pages,
        hasPrev: page > 1,
      },
    });
  }

  static error(res: Response, message: string = 'An error occurred', status: number = 500, errors: any = null) {
    return res.status(status).json({
      success: false,
      message,
      errors,
    });
  }
}
export default ApiResponse;
