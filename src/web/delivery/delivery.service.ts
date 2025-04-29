import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Delivery, DeliveryDocument } from './delivery.schema/delivery.schema';
import { Model } from 'mongoose';
import { CancelDeliveryDTO, CreateDeliveryDTO, UpdateDeliveryDTO } from './delivery.dto/delivery.dto';
import { Dispatcher } from '../dispatcher/dispatcher.schema/dispatcher.schema';
import { log } from 'console';
import { IRecipient } from './delivery.interface/delivery.interface';

@Injectable()
export class DeliveryService {
    constructor (
        @InjectModel(Delivery.name) private readonly deliveryModel: Model<DeliveryDocument>
    ) {}
    private async getDelivery (tracking_id: string, dispatcher: Dispatcher) {
        let delivery = await this.deliveryModel.findOne({tracking_id});
        if (!delivery) throw new NotFoundException({message: `Delivery with Tracking ID ${tracking_id} not found`});
        if (delivery.dispatcher.toString().trim() != (<any>dispatcher).id.toString().trim()) throw new UnauthorizedException({message: "Permission denied"})
        log({delivery})
        return delivery
    }
    async addDelivery (data: CreateDeliveryDTO, dispatcher: Dispatcher) {

        let count: number = await this.deliveryModel.countDocuments()
        count += 1;

        const tracking_id = "ORD" + String(count).padStart(4, '0');

        let recipient: IRecipient = {
            phone_number_1: data.recipient_phone_number_1,
            phone_number_2: data.recipient_phone_number_2,
            email: data.recipient_email
        }

        let delivery = new this.deliveryModel({ ... data,  tracking_id, dispatcher, recipient });

        await delivery.save()

        // log({dispatcher});

        // await this.deliveryModel.findByIdAndUpdate(delivery.id, { dispatcher })

        return await this.deliveryModel.findById(delivery.id);
    }
    async updateDelivery (data: UpdateDeliveryDTO, tracking_id: string, dispatcher: Dispatcher) {
        let delivery = await this.getDelivery(tracking_id, dispatcher);

        let recipient: IRecipient = {
            phone_number_1: data.recipient_phone_number_1,
            phone_number_2: data.recipient_phone_number_2,
            email: data.recipient_email
        }

        log({data})

        await this.deliveryModel.findByIdAndUpdate(delivery.id, { ... data, recipient });
        await this.deliveryModel.findByIdAndUpdate(delivery.id, { specimen: data.specimen });

        return await this.deliveryModel.findById(delivery.id);
    }
    async cancelDelivery (data: CancelDeliveryDTO, tracking_id: string, dispatcher: Dispatcher) {
         let delivery = await this.getDelivery(tracking_id, dispatcher);

         if (delivery.active) throw new UnauthorizedException({message: "This delivery is already in service"})

         await this.deliveryModel.findByIdAndUpdate(delivery.id, { ... data, isCancelled: true });

         return await this.deliveryModel.findById(delivery.id);
    }
    async viewDelivery (tracking_id: string, dispatcher: Dispatcher) {

    }
    async viewAllDelivery (query: object, dispatcher: Dispatcher) {

    }
}
