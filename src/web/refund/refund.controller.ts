import { Body, Controller, Get, Inject, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard, UserGuard } from '../auth/auth.guards/auth.guard';
import { AuthUser } from '../auth/auth.decorators/auth.decorator';
import { User } from '../user/user.schema/user.schema';
import { RefundService } from './refund.service';
import { OpenRefundDTO } from './refund.dto/refund.dto';

@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@UseGuards(UserGuard)
@Controller('refund')
export class RefundController {
    constructor(
            @Inject() private readonly refundService: RefundService
        ) { }
    
        @Post('create/:tracking_id')
        @ApiParam({ name: 'tracking_id', type: 'string', description: 'Tracking ID for the delivery', required: true, example: "ORD0041" })
        async openRefundRequest(@Body() issueData: OpenRefundDTO, @AuthUser() user: User, @Param("tracking_id") deliveryId: string) {
            return await this.refundService.openRefundRequest(issueData, user, deliveryId);
        }
    
        @Get("view/:tracking_id")
        @ApiParam({ name: 'tracking_id', type: 'string', description: 'Tracking ID', required: true, example: "RFD0002" })
        async viewRefund(@Param("tracking_id") trackingId: string) {
            return await this.refundService.viewRefund(trackingId);
        }
    
        @Get("all-my-refunds")
        @ApiQuery({ name: 'query', required: false, type: 'string', description: 'The search parameter ', example: 'John' })
        @ApiQuery({ name: 'type', required: false, type: 'string', enum: ["Duplicate-Charge", "Cancelled-By-Admin", "...."], description: 'The type of refund (optional)', example: 'Duplicate-Charge' })
        @ApiQuery({ name: 'status', required: false, type: 'string', enum: ["pending", "declined", "approved"], description: 'The status of issue (optional)', example: 'open' })
        @ApiQuery({ name: 'page', required: false, type: 'number', description: 'The current page for the pagination (optional)', example: 1 })
        @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'The number of results expected (optional)', example: 10 })
        @ApiQuery({ name: 'sort', required: false, type: 'boolean', description: 'Set the order of results {true => ascending, false => descending} (optional)', example: true })
        @ApiQuery({ name: 'from_date', required: false, type: 'string', format: 'date-time', description: 'The date to start the sort', example: '2025-04-29T19:25:16.546Z' })
        @ApiQuery({ name: 'to_date', required: false, type: 'string', format: 'date-time', description: 'The date to start the sort', example: '2025-09-29T19:25:16.546Z' })
        async getMyRefundRequests(@AuthUser() user: User, @Query() query: any) {
            return await this.refundService.getMyRefundRequests(user, query);
        }
    
}
