import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
// import { Dispatcher, DispatcherDocument } from './dispatcher.schema/dispatcher.schema';
import { Model } from 'mongoose';
// import { JwtService } from '@nestjs/jwt';
// import { DispatcherSignInDTO, DispatcherSignUpDTO } from './dispatcher.dto/dispatcher.dto';
import { DeliveryService } from '../delivery/delivery.service';
import { CancelDeliveryDTO, CreateDeliveryDTO, DeliveryQueryDTO, UpdateDeliveryDTO } from '../delivery/delivery.dto/delivery.dto';
import { User } from '../user/user.schema/user.schema';

@Injectable()
export class DispatcherService {
    private logger = new Logger(DispatcherService.name)
    constructor(
        // private readonly jwtService: JwtService,
        // @Inject(forwardRef(() => DeliveryService))
        private readonly deliveryService: DeliveryService,
        // @InjectModel(Dispatcher.name) private readonly dispatcherModel: Model<DispatcherDocument>
    ) { }
    
    async addDelivery(data: CreateDeliveryDTO, dispatcher: User) {
        this.logger.log("Add delivery")
        return await this.deliveryService.addDelivery(data, dispatcher)
    }
    async updateDelivery(data: UpdateDeliveryDTO, tracking_id: string, dispatcher: User) {
        this.logger.log("Update delivery")
        return await this.deliveryService.updateDelivery(data, tracking_id, dispatcher)
    }
    async cancelDelivery(data: CancelDeliveryDTO, tracking_id: string, dispatcher: User) {
        this.logger.log("Cancel delivery")
        return await this.deliveryService.cancelDelivery(data, tracking_id, dispatcher)
    }
    async viewDelivery (tracking_id: string, dispatcher: User) {
        return await this.deliveryService.viewDelivery(tracking_id, dispatcher);
    }
    async viewAllDelivery (query: DeliveryQueryDTO, dispatcher: User) {
        return await this.deliveryService.viewAllDelivery(query, dispatcher);
    }
    // async submitDelivery (tracking_id: string, dispatcher: User) {
    //     return await this.deliveryService.submitDelivery(tracking_id, dispatcher);
    // }
}
