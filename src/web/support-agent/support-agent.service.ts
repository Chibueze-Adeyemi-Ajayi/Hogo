import { Inject, Injectable } from '@nestjs/common';
import { User } from '../user/user.schema/user.schema';
import { DeliveryService } from '../delivery/delivery.service';
import { UserService } from '../user/user.service';

@Injectable()
export class SupportAgentService {
    constructor (
        @Inject() private readonly userService: UserService,
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
}
