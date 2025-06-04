import { Body, Controller, Get, Inject, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard, SupportAgentGuard, UserGuard } from '../auth/auth.guards/auth.guard';
import { AuthUser } from '../auth/auth.decorators/auth.decorator';
import { User } from '../user/user.schema/user.schema';
import { SupportAgentService } from './support-agent.service';
import { UpdateIssuesDTO } from '../issues/issues.dto/issues.dto';

@Controller('support-agent')
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@UseGuards(SupportAgentGuard)
@UseGuards(UserGuard)
export class SupportAgentController {
    constructor(
        @Inject() private readonly supportAgentService: SupportAgentService
    ) { }
    @Get("dashboard")
    async dashboard(@AuthUser() user: User) {
        return await this.supportAgentService.dashboard(user);
    }
    @Get("users")
    @ApiQuery({ name: 'query', required: false, type: 'string', description: 'The search parameter - name, email, role, department, phone number, staff_number, admin_id (optional)', example: 'John' })
    @ApiQuery({ name: 'role', required: false, type: 'string', description: 'Roles of the user', example: "Courier" })
    @ApiQuery({ name: 'status', required: false, type: 'boolean', description: 'Select if the user has been approved (optional)', example: true })
    @ApiQuery({ name: 'active', required: false, type: 'boolean', description: 'Select if the user is active (optional)', example: true })
    @ApiQuery({ name: 'page', required: false, type: 'number', description: 'The current page for the pagination (optional)', example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'The number of results expected (optional)', example: 10 })
    @ApiQuery({ name: 'sort', required: false, type: 'boolean', description: 'Set the order of results {true => ascending, false => descending} (optional)', example: true })
    @ApiQuery({ name: 'date_filter_type', required: false, type: 'string', enum: ['creation-date', 'delivery-date'], description: 'While using date filter set appropraitely to know the date to be considered when filtering within date range (optional)', example: 'creation-date' })
    @ApiQuery({ name: 'from_date', required: false, type: 'string', format: 'date-time', description: 'The date to start the sort', example: '2025-04-29T19:25:16.546Z' })
    @ApiQuery({ name: 'to_date', required: false, type: 'string', format: 'date-time', description: 'The date to start the sort', example: '2025-09-29T19:25:16.546Z' })
    async users(@AuthUser() user: User, @Query() query: any) {
        return await this.supportAgentService.loadUsers(query);
    }
    @Get("user/:userId")
    @ApiParam({ name: 'userId', type: 'string', description: 'ID of the user', required: true, example: "6823bbe1580a03248d1c205c" })
    async viewUser(@Param("userId") userId: string) {
        return await this.supportAgentService.viewUser(userId);
    }
    @Get("view/delivery/:tracking_id")
    @ApiParam({ name: 'tracking_id', type: 'string', description: 'Tracking ID', required: true, example: "ORD0041" })
    async viewDelivery(@Param("tracking_id") tracking_id: string) {
        return await this.supportAgentService.viewDelivery(tracking_id)
    }
    @ApiQuery({ name: 'query', required: false, type: 'string', description: 'The search parameter ', example: 'John' })
    @ApiQuery({ name: 'type', required: false, type: 'string', enum: ["Delivery-Failed", "Incorrect-Drop-off-Info", "...."], description: 'The type of issue (optional)', example: 'Delivery-Failed' })
    @ApiQuery({ name: 'status', required: false, type: 'string', enum: ["open", "in-review", "resolved"], description: 'The status of issue (optional)', example: 'open' })
    @ApiQuery({ name: 'page', required: false, type: 'number', description: 'The current page for the pagination (optional)', example: 1 })
    @ApiQuery({ name: 'limit', required: false, type: 'number', description: 'The number of results expected (optional)', example: 10 })
    @ApiQuery({ name: 'sort', required: false, type: 'boolean', description: 'Set the order of results {true => ascending, false => descending} (optional)', example: true })
    @ApiQuery({ name: 'from_date', required: false, type: 'string', format: 'date-time', description: 'The date to start the sort', example: '2025-04-29T19:25:16.546Z' })
    @ApiQuery({ name: 'to_date', required: false, type: 'string', format: 'date-time', description: 'The date to start the sort', example: '2025-09-29T19:25:16.546Z' })
    @Get("all-issues")
    async allIssues(@Query() query: any) {
        return await this.supportAgentService.allIssues(query);
    }
    @Get("view/issues/:tracking_id")
    @ApiParam({ name: 'tracking_id', type: 'string', description: 'Tracking ID', required: true, example: "ISS0002" })
    async viewIssue(@Param("tracking_id") tracking_id: string) {
        return await this.supportAgentService.viewIssue(tracking_id);
    }
    @Patch("update/issues-status/:tracking_id")
    @ApiParam({ name: 'tracking_id', type: 'string', description: 'Tracking ID', required: true, example: "ISS0002" })
    async updateIssueStatus(@Param("tracking_id") tracking_id: string, @Body() issueData: UpdateIssuesDTO) {
        return await this.supportAgentService.updateIssueStatus(tracking_id, issueData);
    }
}
