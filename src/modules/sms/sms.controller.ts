import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SendSmsDto } from './dto/send-sms.dto';
import { ApiKeyGuard } from '../api-keys/guards/api-key.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import type { AuthenticatedUser } from '../../common/types/authenticated-request.interface';

@Controller('sms')
@UseGuards(ApiKeyGuard)
export class SmsController {
  constructor(private readonly smsService: SmsService) {}

  @Post('send')
  send(@CurrentUser() user: AuthenticatedUser, @Body() dto: SendSmsDto) {
    return this.smsService.send(user.id, dto);
  }
}
