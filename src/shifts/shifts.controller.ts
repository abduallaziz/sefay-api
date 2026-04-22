import { Controller, Post, Get, Body, UseGuards, Request } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ShiftsService } from './shifts.service';

@Controller('shifts')
@UseGuards(AuthGuard('jwt'))
export class ShiftsController {
  constructor(private shiftsService: ShiftsService) {}

  @Get('current')
  async getCurrentShift(@Request() req: any) {
    return this.shiftsService.getCurrentShift(req.user);
  }

  @Post('open')
  async openShift(@Request() req: any, @Body() body: { opening_cash: number }) {
    return this.shiftsService.openShift(req.user, body.opening_cash);
  }

  @Post('close')
  async closeShift(@Request() req: any, @Body() body: { closing_cash: number }) {
    return this.shiftsService.closeShift(req.user, body.closing_cash);
  }
}