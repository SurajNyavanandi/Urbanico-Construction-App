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

  public static getUserOrders = asyncHandler(async (req: Request, res: Response) => {
    const phone = (req.query.phone as string) || (req.params.phone as string) || (req as any).user?.phone;
    const { OrderService } = await import('../services/orderService');
    const orders = await OrderService.getAllOrders({
      phone: phone ? String(phone).replace(/[^0-9]/g, '') : undefined,
    });
    return sendSuccess(res, { orders, count: orders.length });
  });

  public static getUserCart = asyncHandler(async (req: Request, res: Response) => {
    const phone = (req.query.phone as string) || (req.params.phone as string) || (req as any).user?.phone;
    if (!phone) {
      return sendSuccess(res, { cart: [] });
    }
    const user: any = await UserService.getUserByPhone(phone);
    return sendSuccess(res, { cart: user?.cart || [] });
  });

  public static updateUserCart = asyncHandler(async (req: Request, res: Response) => {
    const phone = (req.query.phone as string) || (req.params.phone as string) || (req as any).user?.phone || req.body.phone;
    const { cart } = req.body;
    if (!phone) {
      return sendError(res, 'User phone is required to persist cart', 400);
    }
    const updated = await UserService.updateUser(phone, { cart: Array.isArray(cart) ? cart : [] });
    return sendSuccess(res, { cart: updated?.cart || cart || [] });
  });

  public static getUserAddresses = asyncHandler(async (req: Request, res: Response) => {
    const phone = (req.query.phone as string) || (req.params.phone as string) || (req as any).user?.phone;
    if (!phone) {
      return sendSuccess(res, { deliverySites: [], savedLocations: [] });
    }
    const user: any = await UserService.getUserByPhone(phone);
    return sendSuccess(res, {
      deliverySites: user?.deliverySites || [],
      savedLocations: user?.savedLocations || [],
    });
  });

  public static addAddress = asyncHandler(async (req: Request, res: Response) => {
    const phone = (req.query.phone as string) || (req.params.phone as string) || (req as any).user?.phone || req.body.phone;
    const { siteName, address, pincode, supervisorName, supervisorPhone, isPrimary } = req.body;
    if (!phone) {
      return sendError(res, 'User phone is required', 400);
    }
    const user: any = (await UserService.getUserByPhone(phone)) || (await UserService.findOrCreateUser(phone));
    const currentSites = user.deliverySites || [];
    const newSite = {
      siteName: siteName || 'Construction Site',
      address: address || '',
      pincode: pincode || '500049',
      supervisorName: supervisorName || user.name || 'Supervisor',
      supervisorPhone: supervisorPhone || phone,
      isPrimary: isPrimary ?? currentSites.length === 0,
    };
    const updatedSites = [newSite, ...currentSites.filter((s: any) => s.address !== address)];
    const savedLocs = Array.from(new Set([address, ...(user.savedLocations || [])].filter(Boolean)));
    const updated = await UserService.updateUser(phone, {
      deliverySites: updatedSites,
      savedLocations: savedLocs,
    });
    return sendSuccess(res, {
      deliverySites: updated?.deliverySites || updatedSites,
      savedLocations: updated?.savedLocations || savedLocs,
    });
  });

  public static deleteAllUsers = asyncHandler(async (_req: Request, res: Response) => {
    await UserService.purgeAllUsers();
    return sendSuccess(res, { count: 0 }, 'All user profiles, carts, and delivery sites purged successfully');
  });
}
