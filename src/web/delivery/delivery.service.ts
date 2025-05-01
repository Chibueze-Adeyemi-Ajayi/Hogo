import { ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Delivery, DeliveryDocument } from './delivery.schema/delivery.schema';
import mongoose, { Model, Mongoose, Types } from 'mongoose';
import { CancelDeliveryDTO, CreateDeliveryDTO, DeliveryQueryDTO, UpdateDeliveryDTO } from './delivery.dto/delivery.dto';
import { Dispatcher } from '../dispatcher/dispatcher.schema/dispatcher.schema';
import { log } from 'console';
import { IRecipient } from './delivery.interface/delivery.interface';
import { DateFilterType } from './delivery.enum/delivery.enum';
import { UtilsService } from 'src/common/utils/utils.service';

@Injectable()
export class DeliveryService {
    constructor(
        @Inject() private readonly utilService: UtilsService,
        @InjectModel(Delivery.name) private readonly deliveryModel: Model<DeliveryDocument>
    ) { }
    private async getDelivery(tracking_id: string, dispatcher: Dispatcher) {
        let delivery = await this.deliveryModel.findOne({ tracking_id });
        if (!delivery) throw new NotFoundException({ message: `Delivery with Tracking ID ${tracking_id} not found` });
        if (delivery.dispatcher.toString().trim() != (<any>dispatcher).id.toString().trim()) throw new UnauthorizedException({ message: "Permission denied" })
        log({ delivery })
        return delivery
    }
    async addDelivery(data: CreateDeliveryDTO, dispatcher: Dispatcher) {

        let count: number = await this.deliveryModel.countDocuments()
        count += 1;

        const tracking_id = "ORD" + String(count).padStart(4, '0');

        let recipient: IRecipient = {
            phone_number_1: data.recipient_phone_number_1,
            phone_number_2: data.recipient_phone_number_2,
            email: data.recipient_email
        }

        let delivery = new this.deliveryModel({ ...data, tracking_id, dispatcher, recipient });

        await delivery.save()

        // log({dispatcher});

        // await this.deliveryModel.findByIdAndUpdate(delivery.id, { dispatcher })

        return await this.deliveryModel.findById(delivery.id);
    }
    async updateDelivery(data: UpdateDeliveryDTO, tracking_id: string, dispatcher: Dispatcher) {
        let delivery = await this.getDelivery(tracking_id, dispatcher);

        let recipient: IRecipient = {
            phone_number_1: data.recipient_phone_number_1,
            phone_number_2: data.recipient_phone_number_2,
            email: data.recipient_email
        }

        log({ data })

        await this.deliveryModel.findByIdAndUpdate(delivery.id, { ...data, recipient });
        await this.deliveryModel.findByIdAndUpdate(delivery.id, { specimen: data.specimen });

        return await this.deliveryModel.findById(delivery.id);
    }
    async cancelDelivery(data: CancelDeliveryDTO, tracking_id: string, dispatcher: Dispatcher) {
        let delivery = await this.getDelivery(tracking_id, dispatcher);

        if (delivery.active) throw new UnauthorizedException({ message: "This delivery is already in service" })

        await this.deliveryModel.findByIdAndUpdate(delivery.id, { ...data, isCancelled: true });

        return await this.deliveryModel.findById(delivery.id);
    }
    async viewDelivery(tracking_id: string, dispatcher: Dispatcher) {
        return await this.getDelivery(tracking_id, dispatcher);
    }
    async viewAllDelivery(query: DeliveryQueryDTO, dispatcher: Dispatcher) {

        const {
            page = 1,
            limit = 10,
            sort = true,
            canceled = false,
            date_filter_type,
            from_date,
            to_date,
            status,
            query: searchQuery
        } = query;

        log({ query })

        const skip = (page - 1) * limit;
        const sortOrder = sort ? 1 : -1; // 1 for ascending, -1 for descending

        const mongoQuery: any = { isCancelled: canceled }; // Filter by cancellation status

        // Date filtering
        if (date_filter_type && from_date && to_date) {
            const dateField = date_filter_type === DateFilterType.CREATION_DATE ? 'createdAt' : 'delivery_date';
            mongoQuery[dateField] = {
                $gte: new Date(from_date),
                $lte: new Date(to_date),
            };
        }

        // Full-text search
        if (searchQuery) {
            mongoQuery.$or = [
                { tracking_id: { $regex: searchQuery, $options: 'i' } },
                { 'pickup_address': { $regex: searchQuery, $options: 'i' } },
                { 'dropoff_address': { $regex: searchQuery, $options: 'i' } },
                { 'location': { $regex: searchQuery, $options: 'i' } },
                { 'recipient.email': { $regex: searchQuery, $options: 'i' } },
                { 'recipient.phone_number_1': { $regex: searchQuery, $options: 'i' } },
                { 'recipient.phone_number_2': { $regex: searchQuery, $options: 'i' } },
            ];
        }

        if (status) {
            mongoQuery.status = status;
        }

        mongoQuery.dispatcher = new Types.ObjectId((<any>(<any>dispatcher).id).toString())

        log(mongoQuery)

        try {
            const deliveries = await this.deliveryModel
                .find(mongoQuery)
                .skip(skip)
                .limit(limit)
                .sort({ [date_filter_type]: sortOrder }) // Sort by the selected date field
                .exec();

            const total = await this.deliveryModel.countDocuments(mongoQuery);
            return {
                deliveries,
                page,
                limit,
                total,
            };
        } catch (error) {
            console.error("Error fetching deliveries:", error);
            throw new NotFoundException({ message: "Failed to retrieve deliveries" }); // Or handle the error as needed
        }
    }
    async submitDelivery (tracking_id: string, dispatcher: Dispatcher) {
        const delivery: Delivery = await this.getDelivery(tracking_id, dispatcher);
        if (delivery.status != "pending") throw new ConflictException({message: "Order is already been " + delivery.status})
        if (delivery.isCancelled) throw new ConflictException({message:"This delivery has already been cancelled"})
        this.utilService.sendEmail("", "", delivery.recipient.email);
        return {
            message: "Request has been sent to the recipient for approval",
            delivery
        }
    }
}