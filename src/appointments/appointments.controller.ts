import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AppointmentsService } from './appointments.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { OnboardingGuard } from '../guards/onboarding.guard';

@UseGuards(JwtAuthGuard, OnboardingGuard)
@Controller('appointments')
export class AppointmentsController {
  constructor(private readonly appointmentsService: AppointmentsService) {}

  // ─── Availability ───────────────────────────────
  @Post('availability')
  setAvailability(@Request() req: any, @Body() body: any) {
    return this.appointmentsService.setAvailability(req.user, body);
  }

  @Get('availability')
  getAvailability(@Request() req: any, @Query('worker_id') worker_id?: string) {
    return this.appointmentsService.getAvailability(req.user, worker_id);
  }

  // ─── Slots ──────────────────────────────────────
  @Get('slots')
  getSlots(
    @Request() req: any,
    @Query('worker_id') worker_id: string,
    @Query('date') date: string,
  ) {
    return this.appointmentsService.getAvailableSlots(req.user, worker_id, date);
  }

  // ─── Appointments ───────────────────────────────
  @Post()
  create(@Request() req: any, @Body() body: any) {
    return this.appointmentsService.createAppointment(req.user, body);
  }

  @Get()
  findAll(@Request() req: any, @Query('date') date?: string) {
    return this.appointmentsService.getAppointments(req.user, date);
  }

  @Patch(':id')
  update(@Request() req: any, @Param('id') id: string, @Body() body: any) {
    return this.appointmentsService.updateAppointment(req.user, id, body);
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.appointmentsService.deleteAppointment(req.user, id);
  }
} 
