import { ConflictException, forwardRef, Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { DeliveryService } from '../delivery/delivery.service';
import { DeliveryQueryDTO } from '../delivery/delivery.dto/delivery.dto';
import { User } from '../user/user.schema/user.schema';
import { CourierOnDutyModeDTO } from './courier.dto/courier.dto';
import { UserService } from '../user/user.service';
import { MicrosoftAzureService } from 'src/third-party/microsoft-azure/microsoft-azure.service';
import { log } from 'console';

@Injectable()
export class CourierService {
    constructor(
        @Inject() private readonly userService: UserService,
        @Inject() private readonly microsoftAzureService: MicrosoftAzureService,
        @Inject(forwardRef(() => DeliveryService)) private readonly deliveryService: DeliveryService,
    ) { }
    async viewAvailablePickupDelivery(query: DeliveryQueryDTO, courier: User) {
        return await this.deliveryService.viewAvailablePickupDelivery(query, courier);
    }
    async myPickupDelivery(query: DeliveryQueryDTO, courier: User) {
        return await this.deliveryService.myPickupDelivery(query, courier);
    }
    async acceptPickup(tracking_id: string, courier: User) {
        return await this.deliveryService.acceptPickup(tracking_id, courier)
    }
    async viewPickup(tracking_id: string, courier: User) {
        return await this.deliveryService.viewDelivery(tracking_id, courier)
    }
    async toggleOnDutyMode(data: CourierOnDutyModeDTO, courier: User) {
        if (courier.role.toLowerCase().trim() != "courier") throw new UnauthorizedException({ message: "Account type is not a courier" })
        return await this.userService.toggleIsActiveMode(data, courier);
    }
    async allActiveCourier() {
        return await this.userService.allActiveUsers("Courier");
    }
    async submitPickup(sessionId: string, courier: User, file: Express.Multer.File) {
        // log({file})
        let delivery = await this.deliveryService.viewDeliveryBySessionId(sessionId);
        // log({delivery})
        let data = await this.microsoftAzureService.uploadFiles([file]);
        let { url } = data[0];

        if (!await this.deliveryService.submitDeliveryAfterPickup({
            delivery_evidence: url,
            status: 'awaiting-approval'
        }, (<any>delivery).id, sessionId)) throw new ConflictException({ message: "Please submit " });

        return {
            message: "Package submitted successfully, you'd been contacted once approved",
            data: await this.deliveryService.viewDelivery(delivery.tracking_id)
        }

    }
    async getActiveCourier() {
        return await this.userService.getActiveUsers({ role: "Courier" })
    }
}
