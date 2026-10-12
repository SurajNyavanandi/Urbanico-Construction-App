import { AuditLog } from '../models/AuditLog';
import mongoose from 'mongoose';

export interface AuditEventParams {
  action: string;
  actorType?: 'user' | 'admin' | 'system' | 'gateway';
  actorId?: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, any>;
  ip?: string;
  userAgent?: string;
}

const inMemoryAuditTrail: any[] = [];

export class AuditService {
  public static async log(params: AuditEventParams): Promise<void> {
    try {
      if (mongoose.connection.readyState === 1) {
        await AuditLog.create({
          action: params.action,
          actorType: params.actorType || 'system',
          actorId: params.actorId,
          targetType: params.targetType,
          targetId: params.targetId,
          details: params.details,
          ip: params.ip,
          userAgent: params.userAgent,
        });
        return;
      }
    } catch (err: any) {
      console.warn('[Audit Log] Database write deferred, queuing in-memory:', err?.message || err);
    }

    inMemoryAuditTrail.unshift({
      ...params,
      createdAt: new Date(),
    });
    if (inMemoryAuditTrail.length > 500) {
      inMemoryAuditTrail.pop();
    }
  }

  public static async getLogs(filter: { action?: string; limit?: number; page?: number } = {}) {
    const limit = Math.min(100, Math.max(1, filter.limit || 50));
    const page = Math.max(1, filter.page || 1);
    const skip = (page - 1) * limit;

    try {
      if (mongoose.connection.readyState === 1) {
        const query: any = {};
        if (filter.action) query.action = filter.action;
        const total = await AuditLog.countDocuments(query);
        const logs = await AuditLog.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean();
        return { logs, total, page, limit, totalPages: Math.ceil(total / limit) };
      }
    } catch {
      // fallback
    }

    const filtered = filter.action
      ? inMemoryAuditTrail.filter((l) => l.action === filter.action)
      : inMemoryAuditTrail;
    const paginated = filtered.slice(skip, skip + limit);
    return {
      logs: paginated,
      total: filtered.length,
      page,
      limit,
      totalPages: Math.ceil(filtered.length / limit),
    };
  }
}

export default AuditService;
