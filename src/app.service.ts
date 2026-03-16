import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getInfo() {
    return {
      service: 'sms-sending-api',
      version: '1.0.0',
      docs: '/docs',
    };
  }
}
