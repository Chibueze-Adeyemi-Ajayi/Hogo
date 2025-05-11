import { Controller, Get, Inject, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { AuthUser } from '../auth/auth.decorators/auth.decorator';
import { CourierService } from './courier.service';
import { User } from '../user/user.schema/user.schema';
import { JwtAuthGuard, UserGuard } from '../auth/auth.guards/auth.guard';

@Controller('courier')
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@UseGuards(UserGuard)
export class CourierController {

    constructor(
        @Inject() private readonly courierService: CourierService
    ) { }

    @Get("pick-up/list")
    @ApiQuery({ name: 'query', required: false, type: 'string', description: 'The search parameter - tracking_id, addresses, courier, location, recipient (email & phone number) (optional)', example: 'ORD0009' })
    @ApiQuery({ name: 'page', required: false, type: 'number', description: 'The current page for the pagination (optional)', example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'The number of results expected (optional)', example: 10 })
    // @ApiQuery({ name: 'canceled', required: false, type: 'boolean', description: 'Filter the result as active or canceled delivery {false => active delivery, true => cancelled delivery} (optional)', example: false })
    @ApiQuery({ name: 'sort', required: false, type: 'boolean', description: 'Set the order of results {true => ascending, false => descending} (optional)', example: true })
    @ApiQuery({ name: 'date_filter_type', required: false, type: 'string', enum: ['creation-date', 'delivery-date'], description: 'While using date filter set appropraitely to know the date to be considered when filtering within date range (optional)', example: 'creation-date' })
    @ApiQuery({ name: 'from_date', required: false, type: 'string', format: 'date-time', description: 'The date to start the sort', example: '2025-04-29T19:25:16.546Z' })
    @ApiQuery({ name: 'to_date', required: false, type: 'string', format: 'date-time', description: 'The date to start the sort', example: '2025-09-29T19:25:16.546Z' })
    async viewAvailablePickupDelivery(@AuthUser() courier: User, @Query() query: any) {
        return await this.courierService.viewAvailablePickupDelivery(query, courier);
    }

    @Get("pick-up/my-list")
    @ApiQuery({ name: 'query', required: false, type: 'string', description: 'The search parameter - tracking_id, addresses, courier, location, recipient (email & phone number) (optional)', example: 'ORD0009' })
    @ApiQuery({ name: 'page', required: false, type: 'number', description: 'The current page for the pagination (optional)', example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'The number of results expected (optional)', example: 10 })
    // @ApiQuery({ name: 'canceled', required: false, type: 'boolean', description: 'Filter the result as active or canceled delivery {false => active delivery, true => cancelled delivery} (optional)', example: false })
    @ApiQuery({ name: 'sort', required: false, type: 'boolean', description: 'Set the order of results {true => ascending, false => descending} (optional)', example: true })
    @ApiQuery({ name: 'date_filter_type', required: false, type: 'string', enum: ['creation-date', 'delivery-date'], description: 'While using date filter set appropraitely to know the date to be considered when filtering within date range (optional)', example: 'creation-date' })
    @ApiQuery({ name: 'from_date', required: false, type: 'string', format: 'date-time', description: 'The date to start the sort', example: '2025-04-29T19:25:16.546Z' })
    @ApiQuery({ name: 'to_date', required: false, type: 'string', format: 'date-time', description: 'The date to start the sort', example: '2025-09-29T19:25:16.546Z' })
    async myPickupDelivery(@AuthUser() courier: User, @Query() query: any) {
        return await this.courierService.myPickupDelivery(query, courier);
    }

    @Patch("pick-up/accept/:tracking_id")
    @ApiParam({ name: 'tracking_id', type: 'string', description: 'Tracking ID of the delivery', required: true })
    async pickupDelivery(@AuthUser() courier: User, @Param("tracking_id") tracking_id: any) {
        return await this.courierService.acceptPickup(tracking_id, courier);
    }

    @Get("pick-up/view/:tracking_id")
    @ApiParam({ name: 'tracking_id', type: 'string', description: 'Tracking ID of the delivery', required: true })
    async viewPickup(@AuthUser() courier: User, @Param("tracking_id") tracking_id: any) {
        return await this.courierService.viewPickup(tracking_id, courier);
    }

}
