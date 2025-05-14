import { Body, Controller, Get, Inject, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UserGuard, JwtAuthGuard } from '../auth/auth.guards/auth.guard';
import { ToogleDeliveryDTO } from '../user/user.dto/user.dto';
import { DeliveryService } from './delivery.service';
import { AuthUser } from '../auth/auth.decorators/auth.decorator';
import { User } from '../user/user.schema/user.schema';

@Controller('delivery')
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@UseGuards(UserGuard)
export class DeliveryController {

    constructor (
        @Inject() private readonly deliveryService: DeliveryService
    ) {}

    @Post("recipient/toogle/:slug")
    @ApiParam({ name: 'slug', type: 'string', description: 'Slug sent to recipient email', required: true })
    async toggleDelivery (@Param("slug") slug: string, @Body() action: ToogleDeliveryDTO) {
        return await this.deliveryService.toggleDelivery(slug, action)
    }

    @Get("statistics")
    @ApiQuery({ name: 'type', required: true, type: 'string', description: 'User role', example: "dispatcher" })
    async getDeliveryStatistics(@AuthUser() user: User, @Query("type") type: string) {
        return await this.deliveryService.getDeliveryStatistics(user, type);
    }

}