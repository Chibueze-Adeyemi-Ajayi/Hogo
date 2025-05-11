import { Body, Controller, Get, Inject, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { UserGuard, JwtAuthGuard } from '../auth/auth.guards/auth.guard';
import { ToogleDeliveryDTO } from '../user/user.dto/user.dto';
import { DeliveryService } from './delivery.service';

@Controller('delivery')
// @ApiBearerAuth("JWT-auth")
// @UseGuards(JwtAuthGuard)
// @UseGuards(DispatcherGuard)
export class DeliveryController {

    constructor (
        @Inject() private readonly deliveryService: DeliveryService
    ) {}

    @Post("recipient/toogle/:slug")
    @ApiParam({ name: 'slug', type: 'string', description: 'Slug sent to recipient email', required: true })
    async toggleDelivery (@Param("slug") slug: string, @Body() action: ToogleDeliveryDTO) {
        return await this.deliveryService.toggleDelivery(slug, action)
    }

}