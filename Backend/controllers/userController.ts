import { Request, Response } from 'express';
import { UserService } from '../services/userService';
import { validateBackendProfile } from '../utils/sanitizer';

export class UserController {
  public static async getProfile(req: Request, res: Response) {
    try {
      const phone = (req.query.phone as string) || '+919876543210';
      const user = await UserService.findOrCreateUser(phone, req.body);
      return res.status(200).json({ success: true, user });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async updateProfile(req: Request, res: Response) {
    try {
      const validation = validateBackendProfile(req.body);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed on profile inputs',
          errors: validation.errors,
        });
      }

      const idOrPhone = req.params.id || (req.query.phone as string) || req.body.phone || '+919876543210';
      const user = await UserService.updateUser(idOrPhone, validation.sanitized);
      if (!user) {
        // If not existing, create or find
        const newUser = await UserService.findOrCreateUser(idOrPhone, validation.sanitized);
        return res.status(200).json({ success: true, user: newUser });
      }
      return res.status(200).json({ success: true, user });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}

