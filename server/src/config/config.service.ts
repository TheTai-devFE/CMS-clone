import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

export interface SystemConfigDto {
  brandName?: string;
  logoUrl?: string;
  splashUrl?: string;
  backgroundUrl?: string;
}

@Injectable()
export class ConfigService {
  private readonly CONFIG_KEY = 'system_branding_config';

  constructor(private readonly redis: RedisService) {}

  async getConfig(): Promise<SystemConfigDto> {
    const configStr = await this.redis.get(this.CONFIG_KEY);
    if (!configStr) {
      return {
        brandName: 'CDM Signage',
        logoUrl: '',
        splashUrl: '',
        backgroundUrl: '',
      };
    }
    try {
      return JSON.parse(configStr);
    } catch {
      return {
        brandName: 'CDM Signage',
        logoUrl: '',
        splashUrl: '',
        backgroundUrl: '',
      };
    }
  }

  async updateConfig(dto: SystemConfigDto): Promise<SystemConfigDto> {
    const current = await this.getConfig();
    const updated = { ...current, ...dto };
    await this.redis.set(this.CONFIG_KEY, JSON.stringify(updated));
    return updated;
  }
}
