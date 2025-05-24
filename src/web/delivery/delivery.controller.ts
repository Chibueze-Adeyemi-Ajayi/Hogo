import { Body, Controller, Get, Inject, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { UserGuard, JwtAuthGuard } from '../auth/auth.guards/auth.guard';
import { ToogleDeliveryDTO } from '../user/user.dto/user.dto';
import { DeliveryService } from './delivery.service';
import { AuthUser } from '../auth/auth.decorators/auth.decorator';
import { User } from '../user/user.schema/user.schema';
import { DeliveryQueryDTO } from './delivery.dto/delivery.dto';

@Controller('delivery')
@ApiBearerAuth("JWT-auth")
export class DeliveryController {

    constructor(
        @Inject() private readonly deliveryService: DeliveryService
    ) { }

    @Post("recipient/toogle/:slug")
    @ApiParam({ name: 'slug', type: 'string', description: 'Slug sent to recipient email', required: true })
    async toggleDelivery(@Param("slug") slug: string, @Body() action: ToogleDeliveryDTO) {
        return await this.deliveryService.toggleDelivery(slug, action)
    }

    @Get("recipient/view-delivery/:sessionId")
    @ApiParam({ name: 'sessionId', type: 'string', example: "8e4a4afb-e87d-4620-b0a7-510d1cfe572a", description: 'Session ID of the delivery sent to email', required: true })
    async recipientViewDelivery(@Param("sessionId") sessionId: string) {
        return await this.deliveryService.recipientViewDelivery(sessionId)
    }

    @Patch("recipient/accept-delivery/:sessionId")
    @ApiParam({ name: 'sessionId', type: 'string', example: "8e4a4afb-e87d-4620-b0a7-510d1cfe572a", description: 'Session ID of the delivery sent to email', required: true })
    async confirmDeliverySubmission (@Param("sessionId") sessionId: string) {
        return await this.deliveryService.confirmDeliverySubmission(sessionId);
    }

    // @Get("recipient/all-deliveries/:email")
    // @ApiQuery({ name: 'query', required: false, type: 'string', description: 'The search parameter - tracking_id, addresses, courier, location, (optional)', example: 'ORD0009' })
    // @ApiQuery({ name: 'status', required: false, type: 'string', enum: ["pending", "in-transit", "cancelled", "delivered"], description: 'The status of the delivery (optional)', example: 'pending' })
    // @ApiQuery({ name: 'page', required: false, type: 'number', description: 'The current page for the pagination (optional)', example: 1 })
    // @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'The number of results expected (optional)', example: 10 })
    // @ApiQuery({ name: 'sort', required: false, type: 'boolean', description: 'Set the order of results {true => ascending, false => descending} (optional)', example: true })
    // @ApiQuery({ name: 'date_filter_type', required: false, type: 'string', enum: ['creation-date', 'delivery-date'], description: 'While using date filter set appropraitely to know the date to be considered when filtering within date range (optional)', example: 'creation-date' })
    // @ApiQuery({ name: 'from_date', required: false, type: 'string', format: 'date-time', description: 'The date to start the sort', example: '2025-04-29T19:25:16.546Z' })
    // @ApiQuery({ name: 'to_date', required: false, type: 'string', format: 'date-time', description: 'The date to start the sort', example: '2025-09-29T19:25:16.546Z' })
    // @ApiParam({ name: 'email', type: 'string', description: 'Recipient email that was used by the dispatcher in creating the order', required: true })
    // async recipientViewAllDelivery(@Param("email") email: string, @Query() query: any) {
    //     return await this.deliveryService.recipientViewAllDelivery(email, query);
    // }

    @Get("statistics")
    @UseGuards(JwtAuthGuard)
    @UseGuards(UserGuard)
    @ApiQuery({ name: 'type', required: true, type: 'string', description: 'User role', example: "dispatcher" })
    async getDeliveryStatistics(@AuthUser() user: User, @Query("type") type: string) {
        return await this.deliveryService.getDeliveryStatistics(user, type);
    }

}