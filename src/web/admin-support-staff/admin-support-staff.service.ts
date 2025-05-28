import { ConflictException, Inject, Injectable } from '@nestjs/common';
import { User } from '../user/user.schema/user.schema';
import { DeliveryService } from '../delivery/delivery.service';
import { DeliveryQueryDTO } from '../delivery/delivery.dto/delivery.dto';
import { UserService } from '../user/user.service';
import { UpdateUserDto, UserAccountStatusUpdateDTO } from '../user/user.dto/user.dto';

@Injectable()
export class AdminSupportStaffService {
    constructor (
        @Inject() private readonly userService: UserService,
        @Inject() private readonly deliveryService: DeliveryService
    ) {}
    async dashboard (user: User) {
        return await this.deliveryService.getDeliveryStatisticsForSupportStaff();
    }
    async deliveries (user: User, query: DeliveryQueryDTO) {
        return await this.deliveryService.viewAllDeliverySupportStaff(query)
    }
    async users (user: User, query: any) {
        return await this.userService.getAllUsers(query)
    }
    async getUser(id: string) {
        return this.userService.getUser(id);
    }
    async toggleAccountStatus (id: string, data: UserAccountStatusUpdateDTO) {
        return await this.userService.toggleAccountStatus(id, data);
    }
    async updateProfileSupportStaff(id: string, data: UpdateUserDto) {
        return await this.userService.updateProfileSupportStaff(id, data)
    }
    async updateProfile(user: User, data: UpdateUserDto) {
        if (data.admin_id != process.env.SUPPORT_STAFF_ADMIN_ID) throw new ConflictException({message: "Invalid support staff ID supplied"});
        return await this.userService.updateProfile(user, data);
    }
    async viewProfile(user: User) {
        return await this.userService.viewProfile(user)
    }
}
