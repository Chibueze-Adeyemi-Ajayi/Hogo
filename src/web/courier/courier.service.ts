import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { DeliveryService } from '../delivery/delivery.service';
import { DeliveryQueryDTO } from '../delivery/delivery.dto/delivery.dto';
import { User } from '../user/user.schema/user.schema';
import { CourierOnDutyModeDTO } from './courier.dto/courier.dto';
import { UserService } from '../user/user.service';

@Injectable()
export class CourierService {
    constructor (
        @Inject() private readonly userService: UserService,
        @Inject() private readonly deliveryService: DeliveryService,
    ) {}
    async viewAvailablePickupDelivery(query: DeliveryQueryDTO, courier: User) {
        return await this.deliveryService.viewAvailablePickupDelivery(query, courier);
    }
    async myPickupDelivery(query: DeliveryQueryDTO, courier: User) {
        return await this.deliveryService.myPickupDelivery(query, courier);
    }
    async acceptPickup (tracking_id: string, courier: User) {
        return await this.deliveryService.acceptPickup(tracking_id, courier)
    }
    async viewPickup (tracking_id: string, courier: User) {
        return await this.deliveryService.viewDelivery(tracking_id, courier)
    }
    async toggleOnDutyMode (data: CourierOnDutyModeDTO, courier: User) {
        if (courier.role.toLowerCase().trim() != "courier") throw new UnauthorizedException({message: "Account type is not a courier"})
        return await this.userService.toggleIsActiveMode(data, courier);
    }
    async submitPickup (tracking_id: string, courier: User) {

    }
}
