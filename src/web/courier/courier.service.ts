import { Inject, Injectable } from '@nestjs/common';
import { DeliveryService } from '../delivery/delivery.service';
import { DeliveryQueryDTO } from '../delivery/delivery.dto/delivery.dto';
import { User } from '../user/user.schema/user.schema';

@Injectable()
export class CourierService {
    constructor (
        @Inject() private readonly deliveryService: DeliveryService
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
    // async submitPickup (tracking_id: string, courier: User) {

    // }
}
