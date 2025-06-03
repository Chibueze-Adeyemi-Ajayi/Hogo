import { Body, Controller, Get, Inject, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard, AdminGuard, UserGuard } from '../auth/auth.guards/auth.guard';
import { AdminService } from './admin..service';
import { AuthUser } from '../auth/auth.decorators/auth.decorator';
import { User } from '../user/user.schema/user.schema';
import { UpdateUserDto, UserAccountStatusUpdateDTO } from '../user/user.dto/user.dto';
import { AdminNotificationDto } from '../user/user.dto/user.notification.dto';
import { UpdateDeliveryDTO } from '../delivery/delivery.dto/delivery.dto';

@Controller('admin')
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@UseGuards(AdminGuard)
@UseGuards(UserGuard)
export class AdminController {
    constructor(
        @Inject() private readonly adminService: AdminService
    ) { }
    @Get("dashboard")
    async dashboard(@AuthUser() user: User) {
        return await this.adminService.dashboard(user);
    }
    @Get("deliveries")
    @ApiQuery({ name: 'query', required: false, type: 'string', description: 'The search parameter - tracking_id, addresses, courier, location, recipient (email & phone number) (optional)', example: 'ORD0009' })
    @ApiQuery({ name: 'status', required: false, type: 'string', enum: ["pending", "in-transit", "cancelled", "delivered"], description: 'The status of the delivery (optional)', example: 'pending' })
    @ApiQuery({ name: 'page', required: false, type: 'number', description: 'The current page for the pagination (optional)', example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'The number of results expected (optional)', example: 10 })
    @ApiQuery({ name: 'canceled', required: false, type: 'boolean', description: 'Filter the result as active or canceled delivery {false => active delivery, true => cancelled delivery} (optional)', example: false })
    @ApiQuery({ name: 'sort', required: false, type: 'boolean', description: 'Set the order of results {true => ascending, false => descending} (optional)', example: true })
    @ApiQuery({ name: 'date_filter_type', required: false, type: 'string', enum: ['creation-date', 'delivery-date'], description: 'While using date filter set appropraitely to know the date to be considered when filtering within date range (optional)', example: 'creation-date' })
    @ApiQuery({ name: 'from_date', required: false, type: 'string', format: 'date-time', description: 'The date to start the sort', example: '2025-04-29T19:25:16.546Z' })
    @ApiQuery({ name: 'to_date', required: false, type: 'string', format: 'date-time', description: 'The date to start the sort', example: '2025-09-29T19:25:16.546Z' })
    async deliveries(@AuthUser() user: User, @Query() query: any) {
        return await this.adminService.deliveries(user, query);
    }
    @Get("users")
    @ApiQuery({ name: 'query', required: false, type: 'string', description: 'The search parameter - name, email, role, department, phone number, staff_number, admin_id (optional)', example: 'John' })
    @ApiQuery({ name: 'role', required: false, type: 'string', description: 'Roles of the user', example: "Courier" })
    @ApiQuery({ name: 'status', required: false, type: 'boolean', description: 'Select if the user has been approved (optional)', example: true })
    @ApiQuery({ name: 'active', required: false, type: 'boolean', description: 'Select if the user is active (optional)', example: true })
    @ApiQuery({ name: 'page', required: false, type: 'number', description: 'The current page for the pagination (optional)', example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'The number of results expected (optional)', example: 10 })
    @ApiQuery({ name: 'canceled', required: false, type: 'boolean', description: 'Filter the result as active or canceled delivery {false => active delivery, true => cancelled delivery} (optional)', example: false })
    @ApiQuery({ name: 'sort', required: false, type: 'boolean', description: 'Set the order of results {true => ascending, false => descending} (optional)', example: true })
    @ApiQuery({ name: 'date_filter_type', required: false, type: 'string', enum: ['creation-date', 'delivery-date'], description: 'While using date filter set appropraitely to know the date to be considered when filtering within date range (optional)', example: 'creation-date' })
    @ApiQuery({ name: 'from_date', required: false, type: 'string', format: 'date-time', description: 'The date to start the sort', example: '2025-04-29T19:25:16.546Z' })
    @ApiQuery({ name: 'to_date', required: false, type: 'string', format: 'date-time', description: 'The date to start the sort', example: '2025-09-29T19:25:16.546Z' })
    async users(@AuthUser() user: User, @Query() query: any) {
        return await this.adminService.users(user, query);
    }
    @Get("user/:userId")
    @ApiParam({ name: 'userId', type: 'string', description: 'ID of the user', required: true, example: "6823bbe1580a03248d1c205c" })
    async getUser(@Param("userId") id: string) {
        return await this.adminService.getUser(id)
    }
    @Patch("user/toggle-account/:userId")
    @ApiParam({ name: 'userId', type: 'string', description: 'ID of the user', required: true, example: "6823bbe1580a03248d1c205c" })
    async toggleAccountStatus (@Param("userId") id: string, @Body() data: UserAccountStatusUpdateDTO) {
        return await this.adminService.toggleAccountStatus(id, data);
    }
    @Patch("user/update-profile/:userId")
    @ApiParam({ name: 'userId', type: 'string', description: 'ID of the user', required: true, example: "6823bbe1580a03248d1c205c" })
    async updateProfileSupportStaff(@Param("userId") id: string, @Body() data: UpdateUserDto) {
        return await this.adminService.updateProfileSupportStaff(id, data);
    }
    @Get("view/profile")
    async viewProfile(@AuthUser() user: User) {
        return this.adminService.viewProfile(user);
    }
    @Patch("update/profile")
    async updateProfile(@AuthUser() user: User, @Body() data: UpdateUserDto) {
        return await this.adminService.updateProfile(user, data);
    }
    @Patch("update/notification/settings")
    async updateNotification (@AuthUser() user: User, @Body() data: AdminNotificationDto) {
        return await this.adminService.updateNotification(user, data)
    }
    @Get("view/delivery/:tracking_id")
    @ApiParam({ name: 'tracking_id', type: 'string', description: 'Tracking ID', required: true, example: "ORD0041" })
    async viewDelivery (@Param("tracking_id") tracking_id: string) {
        return await this.adminService.viewDelivery(tracking_id)
    }
    @Patch("update/delivery/:tracking_id")
    @ApiParam({ name: 'tracking_id', type: 'string', description: 'Tracking ID', required: true, example: "ORD0041" })
    async updateDelivery (@Param("tracking_id") tracking_id: string, @AuthUser() user: User, @Body() data: UpdateDeliveryDTO) {
        return await this.adminService.updateDelivery(tracking_id, user, data);
    }
}
