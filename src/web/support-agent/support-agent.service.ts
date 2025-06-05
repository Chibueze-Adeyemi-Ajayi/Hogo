import { Inject, Injectable } from '@nestjs/common';
import { User } from '../user/user.schema/user.schema';
import { DeliveryService } from '../delivery/delivery.service';
import { UserService } from '../user/user.service';
import { IssuesService } from '../issues/issues.service';
// import { UpdateDeliveryDTO } from '../delivery/delivery.dto/delivery.dto';
import { UpdateIssuesDTO } from '../issues/issues.dto/issues.dto';
import { RefundService } from '../refund/refund.service';

@Injectable()
export class SupportAgentService {
    constructor (
        @Inject() private readonly userService: UserService,
        @Inject() private readonly issueService: IssuesService,
        @Inject() private readonly refundService: RefundService,
        @Inject() private readonly deliveryService: DeliveryService,
    ) {}
    async dashboard (user: User) {
        return this.deliveryService.getDeliveryStatisticsForSupportStaff();
    }
    async loadUsers (query: any) {
        return this.userService.getAllUsers(query);
    }
    async viewUser (userId: string) {
        return this.userService.getUser(userId);
    }
    async viewDelivery (tracking_id: string) {
        return await this.deliveryService.viewDelivery(tracking_id);
    }
    async allIssues (query: any) {
        return await this.issueService.getAllIssues(query);
    }
    async viewIssue (tracking_id: string) {
        return await this.issueService.viewIssue(tracking_id);
    }
    async updateIssueStatus (tracking_id: string, issueData: UpdateIssuesDTO) {
        return await this.issueService.updateIssueStatus(issueData, tracking_id);
    }
    async allRefund (query: any) {
        return await this.refundService.getAllRefundRequests(query);
    }
    async viewRefund (tracking_id: string) {
        return await this.refundService.viewRefund(tracking_id);
    }
    async updateRefundStatus (tracking_id: string, issueData: UpdateIssuesDTO) {
        return await this.refundService.updateRefundStatus(issueData, tracking_id);
    }
}
