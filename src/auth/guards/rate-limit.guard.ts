import { CanActivate, ExecutionContext, HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RATE_LIMIT_KEY, RateLimitOptions } from '../decorators/rate-limit.decorator';

interface Bucket {
  count: number;
  resetAt: number;
}

@Injectable()
export class RateLimitGuard implements CanActivate {
  private readonly buckets = new Map<string, Bucket>();

  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const options = this.reflector.getAllAndOverride<RateLimitOptions>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!options) return true;

    const req = context.switchToHttp().getRequest();
    const now = Date.now();
    const key = this.buildKey(req, options);
    const bucket = this.buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      this.buckets.set(key, { count: 1, resetAt: now + options.windowMs });
      return true;
    }

    bucket.count += 1;
    if (bucket.count > options.limit) {
      throw new HttpException('Trop de tentatives. Réessayez plus tard.', HttpStatus.TOO_MANY_REQUESTS);
    }

    return true;
  }

  private buildKey(req: any, options: RateLimitOptions): string {
    const forwarded = String(req.headers?.['x-forwarded-for'] || '').split(',')[0].trim();
    const ip = forwarded || req.ip || req.socket?.remoteAddress || 'unknown';
    const fields = options.bodyFields
      ?.map((field) => String(req.body?.[field] || '').trim().toLowerCase())
      .filter(Boolean)
      .join(':');

    return [options.keyPrefix || req.route?.path || req.url, ip, fields].filter(Boolean).join('|');
  }
}
