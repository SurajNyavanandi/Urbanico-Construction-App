import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { validateBackendProfile } from '../utils/sanitizer';
import { asyncHandler, sendSuccess, sendError } from '../utils/apiResponse';

export class UserController {
  public static sendOtp = asyncHandler(async (req: Request, res: Response) => {
    const { phone } = req.body;
    if (!phone) {
      return sendError(res, 'Mobile number is required to send OTP', 400);
    }
    // As per requirement: for any mobile number, OTP is strictly 261125 until third-party SMS gateway is integrated
    return sendSuccess(res, {
      message: 'OTP sent successfully to registered mobile number',
      otp: '261125',
      phone,
    });
  });

  public static verifyOtp = asyncHandler(async (req: Request, res: Response) => {
    const { phone, otp } = req.body;
    if (!phone) {
      return sendError(res, 'Mobile number is required', 400);
    }
    if (!otp) {
      return sendError(res, 'Verification OTP is required', 400);
    }
    // OTP MUST be 261125
    if (String(otp).trim() !== '261125') {
      return sendError(res, 'Invalid OTP code. Please enter 261125.', 400);
    }

    const user = await UserService.findOrCreateUser(phone);
    return sendSuccess(res, {
      message: 'OTP verified successfully',
      user,
      token: `auth_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    });
  });

  public static getProfile = asyncHandler(async (req: Request, res: Response) => {
    const phone = (req.query.phone as string) || (req.params.phone as string);
    if (!phone) {
      return sendError(res, 'Phone number parameter required', 400);
    }
    const user = await UserService.getUserByPhone(phone) || await UserService.findOrCreateUser(phone);
    return sendSuccess(res, { user });
  });

  public static updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const validation = validateBackendProfile(req.body);
    if (!validation.isValid) {
      return sendError(res, 'Validation failed on profile inputs', 400, validation.errors);
    }

    const idOrPhone = req.params.id || req.params.phone || (req.query.phone as string) || req.body.phone;
    if (!idOrPhone) {
      return sendError(res, 'User ID or Phone number is required to update profile', 400);
    }

    const user = await UserService.updateUser(idOrPhone, validation.sanitized);
    if (!user) {
      const newUser = await UserService.findOrCreateUser(idOrPhone, validation.sanitized);
      return sendSuccess(res, { user: newUser });
    }
    return sendSuccess(res, { user });
  });
}
