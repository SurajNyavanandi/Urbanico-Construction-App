import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { validateBackendProfile } from '../utils/sanitizer';
import { asyncHandler, sendSuccess, sendError } from '../utils/apiResponse';
import { generateAuthToken, AuthenticatedRequest, getPermissionsForRole } from '../middleware/auth';

const CLOUDINARY_PROFILE_PIC = 'https://res.cloudinary.com/dfr0zghtc/image/upload/v1789970335/profilepic_epl2nu.jpg';

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
      return sendError(res, 'Invalid OTP code. Please enter 261125.', 401);
    }

    const user: any = await UserService.findOrCreateUser(phone, {
      avatarUrl: CLOUDINARY_PROFILE_PIC,
      profilePicture: CLOUDINARY_PROFILE_PIC,
    });

    if (!user.avatarUrl) {
      user.avatarUrl = CLOUDINARY_PROFILE_PIC;
    }
    if (!user.profilePicture) {
      user.profilePicture = CLOUDINARY_PROFILE_PIC;
    }

    const token = generateAuthToken({
      _id: user._id,
      phone: user.phone,
      name: user.name,
      role: user.role,
      avatarUrl: CLOUDINARY_PROFILE_PIC,
    });

    const permissions = getPermissionsForRole(user.role || 'contractor');

    return sendSuccess(res, {
      message: 'Authentication successful',
      user: {
        ...((user.toObject && user.toObject()) || user),
        avatarUrl: CLOUDINARY_PROFILE_PIC,
        profilePicture: CLOUDINARY_PROFILE_PIC,
        permissions,
      },
      token,
      role: user.role || 'contractor',
      permissions,
    });
  });

  public static getCurrentUser = asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return sendError(res, 'Not authenticated', 401);
    }
    const user: any = await UserService.getUserById(req.user.id) || await UserService.getUserByPhone(req.user.phone);
    if (!user) {
      return sendError(res, 'User not found', 404);
    }
    const permissions = getPermissionsForRole(user.role || 'contractor');
    return sendSuccess(res, {
      user: {
        ...((user.toObject && user.toObject()) || user),
        avatarUrl: CLOUDINARY_PROFILE_PIC,
        profilePicture: CLOUDINARY_PROFILE_PIC,
        permissions,
      },
      permissions,
    });
  });

  public static getProfile = asyncHandler(async (req: Request, res: Response) => {
    const phone = (req.query.phone as string) || (req.params.phone as string);
    if (!phone) {
      return sendError(res, 'Phone number parameter required', 400);
    }
    const user: any = (await UserService.getUserByPhone(phone)) || (await UserService.findOrCreateUser(phone, {
      avatarUrl: CLOUDINARY_PROFILE_PIC,
      profilePicture: CLOUDINARY_PROFILE_PIC,
    }));
    return sendSuccess(res, {
      user: {
        ...((user.toObject && user.toObject()) || user),
        avatarUrl: CLOUDINARY_PROFILE_PIC,
        profilePicture: CLOUDINARY_PROFILE_PIC,
      },
    });
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

    const user: any = await UserService.updateUser(idOrPhone, {
      ...validation.sanitized,
      avatarUrl: CLOUDINARY_PROFILE_PIC,
      profilePicture: CLOUDINARY_PROFILE_PIC,
    });
    if (!user) {
      const newUser: any = await UserService.findOrCreateUser(idOrPhone, {
        ...validation.sanitized,
        avatarUrl: CLOUDINARY_PROFILE_PIC,
        profilePicture: CLOUDINARY_PROFILE_PIC,
      });
      return sendSuccess(res, {
        user: {
          ...((newUser.toObject && newUser.toObject()) || newUser),
          avatarUrl: CLOUDINARY_PROFILE_PIC,
          profilePicture: CLOUDINARY_PROFILE_PIC,
        },
      });
    }
    return sendSuccess(res, {
      user: {
        ...((user.toObject && user.toObject()) || user),
        avatarUrl: CLOUDINARY_PROFILE_PIC,
        profilePicture: CLOUDINARY_PROFILE_PIC,
      },
    });
  });
}
