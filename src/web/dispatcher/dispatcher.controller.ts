import { Body, Controller, Get, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { DispatcherService } from './dispatcher.service';
import { CancelDeliveryDTO, CreateDeliveryDTO, DeliveryQueryDTO, UpdateDeliveryDTO } from '../delivery/delivery.dto/delivery.dto';
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { DispatcherGuard, JwtAuthGuard } from '../auth/auth.guards/auth.guard';
import { AuthUser } from '../auth/auth.decorators/auth.decorator';
import { Dispatcher } from './dispatcher.schema/dispatcher.schema';

@Controller('dispatcher')
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@UseGuards(DispatcherGuard)
export class DispatcherController {

    constructor(
        @Inject() private readonly dispatcherService: DispatcherService
    ) { }

    @Post()
    async addDelivery(@Body() data: CreateDeliveryDTO, @AuthUser() dispatcher: any) {
        return await this.dispatcherService.addDelivery(data, dispatcher)
    }

    @Patch('update/:tracking_id')
    @ApiParam({ name: 'tracking_id', type: 'string', description: 'ID of the delivery', required: true })
    async updateDelivery(@Body() data: UpdateDeliveryDTO, @Param("tracking_id") tracking_id, @AuthUser() dispatcher: any) {
        return await this.dispatcherService.updateDelivery(data, tracking_id, dispatcher)
    }

    @Patch("cancel/:tracking_id")
    @ApiParam({ name: 'tracking_id', type: 'string', description: 'ID of the delivery', required: true })
    async cancelDelivery(@Body() data: CancelDeliveryDTO, @Param("tracking_id") tracking_id, @AuthUser() dispatcher: any) {
        return await this.dispatcherService.cancelDelivery(data, tracking_id, dispatcher)
    }

    @Get("delivery/:tracking_id")
    @ApiParam({ name: 'tracking_id', type: 'string', description: 'ID of the delivery', required: true })
    async viewDelivery(@AuthUser() dispatcher: any, @Param("tracking_id") tracking_id) {
        return await this.dispatcherService.viewDelivery(tracking_id, dispatcher);
    }

    @Get("all/deliveries")
    @ApiQuery({ name: 'query', required: false, type: 'string', description: 'The search parameter - tracking_id, addresses, courier, location, recipient (email & phone number) (optional)', example: 'ORD0009' })
    @ApiQuery({ name: 'status', required: false, type: 'string', enum: ["pending", "progress", "delivered"], description: 'The status of the delivery (optional)', example: 'pending' })
    @ApiQuery({ name: 'page', required: false, type: 'number', description: 'The current page for the pagination (optional)', example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'The number of results expected (optional)', example: 10 })
    @ApiQuery({ name: 'canceled', required: false, type: 'boolean', description: 'Filter the result as active or canceled delivery {false => active delivery, true => cancelled delivery} (optional)', example: false })
    @ApiQuery({ name: 'sort', required: false, type: 'boolean', description: 'Set the order of results {true => ascending, false => descending} (optional)', example: true })
    @ApiQuery({ name: 'date_filter_type', required: false, type: 'string', enum: ['creation-date', 'delivery-date'], description: 'While using date filter set appropraitely to know the date to be considered when filtering within date range (optional)', example: 'creation-date' })
    @ApiQuery({ name: 'from_date', required: false, type: 'string', format: 'date-time', description: 'The date to start the sort', example: '2025-04-29T19:25:16.546Z' })
    @ApiQuery({ name: 'to_date', required: false, type: 'string', format: 'date-time', description: 'The date to start the sort', example: '2025-09-29T19:25:16.546Z' })
    async allDelivery(@AuthUser() dispatcher: any, @Query() query: any) {
        return await this.dispatcherService.viewAllDelivery(query, dispatcher);
    }

    @Post("submit/delivery:tracking_id")
    @ApiParam({ name: 'tracking_id', type: 'string', description: 'ID of the delivery', required: true })
    async submitDelivery (@Param("tracking_id") tracking_id: string, @AuthUser() dispatcher: Dispatcher) {
        return await this.dispatcherService.submitDelivery(tracking_id, dispatcher);
    }

}