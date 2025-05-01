import { Controller, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { DispatcherGuard, JwtAuthGuard } from '../auth/auth.guards/auth.guard';

@Controller('delivery')
// @ApiBearerAuth("JWT-auth")
// @UseGuards(JwtAuthGuard)
// @UseGuards(DispatcherGuard)
export class DeliveryController {



}