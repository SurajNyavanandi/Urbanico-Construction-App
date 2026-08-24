import { Request, Response } from 'express';
import { UserService } from '../services/userService';

export class UserController {
  public static async getProfile(req: Request, res: Response) {
    try {
      const phone = (req.query.phone as string) || '9876543210';
      const user = await UserService.findOrCreateUser(phone, req.body);
      return res.status(200).json({ success: true, user });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  public static async updateProfile(req: Request, res: Response) {
    try {
      const id = String(req.params.id);
      const user = await UserService.updateUser(id, req.body);
      if (!user) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }
      return res.status(200).json({ success: true, user });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }
}
