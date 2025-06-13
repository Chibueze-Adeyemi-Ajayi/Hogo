import { ConflictException, forwardRef, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Delivery, DeliveryDocument } from './delivery.schema/delivery.schema';
import { Model, Types } from 'mongoose';
import { CancelDeliveryDTO, CreateDeliveryDTO, DeliveryQueryDTO, UpdateDeliveryDTO } from './delivery.dto/delivery.dto';
// import { Dispatcher } from '../dispatcher/dispatcher.schema/dispatcher.schema';
import { log } from 'console';
import { IRecipient } from './delivery.interface/delivery.interface';
import { DateFilterType } from './delivery.enum/delivery.enum';
import { UtilsService } from 'src/common/utils/utils.service';
import { User } from '../user/user.schema/user.schema';
import { UserService } from '../user/user.service';
import { ToogleDeliveryDTO } from '../user/user.dto/user.dto'; // Import your Delivery model/schema
import {
    startOfWeek,
    endOfWeek,
    startOfMonth,
    endOfMonth,
    startOfYear,
    endOfYear,
    subWeeks,
    eachDayOfInterval,
    eachWeekOfInterval,
    eachMonthOfInterval,
    format,
    subMonths,
    addDays
} from 'date-fns'; // Import date-fns
import { enUS, enGB } from 'date-fns/locale'; // Import locale if needed
import { Tracking, TrackingDocument } from './delivery.schema/tracking.schema';
import { v4 as uuidv4 } from 'uuid';
import { CourierService } from '../courier/courier.service';
import { IssuesService } from '../issues/issues.service';
import { RefundService } from '../refund/refund.service';

@Injectable()
export class DeliveryService {
    constructor(
        @Inject() private readonly userService: UserService,
        @Inject() private readonly utilService: UtilsService,
        // @Inject() private readonly refundService: RefundService,
        @Inject() private readonly courierService: CourierService,
        @InjectModel(Delivery.name) private readonly deliveryModel: Model<DeliveryDocument>,
        @InjectModel(Tracking.name) private readonly trackingModel: Model<TrackingDocument>
    ) { }
    private async getDelivery(tracking_id: string, dispatcher: User) {
        let delivery = await this.deliveryModel.findOne({ tracking_id }).populate(["dispatcher", "courier"]).exec();
        if (!delivery) throw new NotFoundException({ message: `Delivery with Tracking ID ${tracking_id} not found` });
        // log({ dispatcher });

        // if (delivery.courier.toString().trim() == (<any>dispatcher).id.toString().trim()) return delivery
        // if (delivery.dispatcher.toString().trim() == (<any>dispatcher).id.toString().trim()) return delivery

        return delivery;

        // log({ delivery })

    }
    async updateTracking(sessionId: string, data) {
        let tracking = await this.trackingModel.findOne({ sessionId });
        if (!tracking) throw new NotFoundException({ message: "Could not track this order, please check thesession ID" });
        await this.trackingModel.findByIdAndUpdate(tracking.id, data);
        return true;
    }
    async addDelivery(data: CreateDeliveryDTO, dispatcher: User) {

        let count: number = await this.deliveryModel.countDocuments()
        count += 1;

        const tracking_id = "ORD" + String(count).padStart(4, '0');

        let recipient: IRecipient = {
            phone_number_1: data.recipient_phone_number_1,
            phone_number_2: data.recipient_phone_number_2,
            email: data.recipient_email
        }

        let price = data.price; // parseInt(data.distance) * parseInt(process.env.UNIT_PRICE_PER_KM)

        let delivery = new this.deliveryModel({ ...data, tracking_id, price, dispatcher, recipient });

        await delivery.save();

        const stacked_delivery = await this.deliveryModel.findById(delivery.id)

        log({ stacked_delivery });

        // await this.deliveryModel.findByIdAndUpdate(delivery.id, { dispatcher })

        const slug = await this.userService.stackRecipient(stacked_delivery);

        if (!slug) throw new ConflictException({ message: "Unable to add recipient" })

        await this.submitDelivery(delivery.tracking_id, dispatcher, slug);

        await this.userService.updateNumOfDeliveryCreated(dispatcher.total_delivery_created + 1, dispatcher);

        return await this.deliveryModel.findById(delivery.id);
    }
    async submitDeliveryAfterPickup(data: { delivery_evidence: string, status: string }, id: string, sessionId: string) {
        let delivery = await this.deliveryModel.findById(id);
        if (!delivery) throw new NotFoundException({ message: "Delivery not found" })
        let update = await this.deliveryModel.findByIdAndUpdate(id, data);
        // forward email
        let receiver = delivery.recipient.email, url = process.env.BASE_URL + "/recipient/" + sessionId;
        const msg = `Hello \n\Your delivery is available for you to pickup from the courier, use this link to confirm ${url}`;
        this.utilService.sendEmail(msg, "Delivery Alert !", receiver, "location");
        return update;
    }
    async updateDelivery(data: UpdateDeliveryDTO, tracking_id: string, dispatcher: User) {
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
    async updateDeliveryFromTracking(delivery: Delivery, data) {
        return await this.deliveryModel.findByIdAndUpdate((<any>delivery).id, data);
    }
    async getTracking(sessionId: string) {
        return await this.trackingModel.findOne({ sessionId })
    }
    async cancelDelivery(data: CancelDeliveryDTO, tracking_id: string, dispatcher: User) {
        let delivery = await this.getDelivery(tracking_id, dispatcher);

        if (delivery.active) throw new UnauthorizedException({ message: "This delivery is already in service" })

        await this.deliveryModel.findByIdAndUpdate(delivery.id, { ...data, status: "cancelled", isCancelled: true });

        return await this.deliveryModel.findById(delivery.id);
    }
    async viewDeliveryByTrackingID(tracking_id: string, dispatcher?: User) {
        let delivery = await this.deliveryModel.findOne({ tracking_id }).populate(["courier", "dispatcher"]).exec();
        return delivery;
    }
    async viewDelivery(tracking_id: string, dispatcher?: User) {
        let delivery = await this.deliveryModel.findOne({ tracking_id }).populate(["courier", "dispatcher"]).exec();
        let tracking = await this.trackingModel.findOne({ delivery: delivery.id })
        return { delivery, sessionId: tracking ? tracking.sessionId : null };
    }
    async viewDeliveryBySessionId(sessionId: string, dispatcher?: User) {
        let tracking = await this.trackingModel.findOne({ sessionId }).populate("delivery").exec();
        if (!tracking) throw new NotFoundException({ message: "Invalid tracking session ID" });
        let delivery = await tracking.delivery;
        // if (!delivery) throw new NotFoundException({ message: "No valid delivery attached to tracking" });
        return delivery;
    }
    async viewAllDelivery(query: DeliveryQueryDTO, dispatcher: User) {

        const {
            page = 1,
            limit = 10,
            sort = true,
            canceled,
            date_filter_type,
            from_date,
            to_date,
            status,
            query: searchQuery
        } = query;

        log({ query })

        const skip = (page - 1) * limit;
        const sortOrder = sort ? (sort.toString() == 'true') ? 1 : -1 : -1; // 1 for ascending, -1 for descending

        const mongoQuery: any = canceled ? { isCancelled: canceled } : {}; // Filter by cancellation status

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
                { 'tracking_id': { $regex: searchQuery, $options: 'i' } },
                { 'pickup_address': { $regex: searchQuery, $options: 'i' } },
                { 'pickup_dept': { $regex: searchQuery, $options: 'i' } },
                { 'pickup_staff_name': { $regex: searchQuery, $options: 'i' } },
                { 'dropoff_address': { $regex: searchQuery, $options: 'i' } },
                { 'dropoff_dept': { $regex: searchQuery, $options: 'i' } },
                { 'dropoff_staff_name': { $regex: searchQuery, $options: 'i' } },
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
                .populate(["courier", "dispatcher"])
                .skip(skip)
                .limit(limit)
                .sort({ ["createdAt"]: sortOrder }) // Sort by the selected date field
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
    async getDeliveries (deliverySearchQuery: any) { return await this.deliveryModel.find(deliverySearchQuery, { _id: 1 }).exec(); }
    async viewAvailablePickupDelivery(query: DeliveryQueryDTO, courier: User) {

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
        const sortOrder = sort ? (sort.toString() == 'true') ? 1 : -1 : -1; // 1 for ascending, -1 for descending

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
                { 'tracking_id': { $regex: searchQuery, $options: 'i' } },
                { 'pickup_address': { $regex: searchQuery, $options: 'i' } },
                { 'pickup_dept': { $regex: searchQuery, $options: 'i' } },
                { 'pickup_staff_name': { $regex: searchQuery, $options: 'i' } },
                { 'dropoff_address': { $regex: searchQuery, $options: 'i' } },
                { 'dropoff_dept': { $regex: searchQuery, $options: 'i' } },
                { 'dropoff_staff_name': { $regex: searchQuery, $options: 'i' } },
                { 'location': { $regex: searchQuery, $options: 'i' } },
                { 'recipient.email': { $regex: searchQuery, $options: 'i' } },
                { 'recipient.phone_number_1': { $regex: searchQuery, $options: 'i' } },
                { 'recipient.phone_number_2': { $regex: searchQuery, $options: 'i' } },
            ];
        }

        // if (status) {
        mongoQuery.status = "pending";
        // }

        // mongoQuery.dispatcher = new Types.ObjectId((<any>(<any>dispatcher).id).toString())
        mongoQuery.isAccepted = true

        log(mongoQuery)

        try {
            const deliveries = await this.deliveryModel
                .find(mongoQuery)
                .populate(["courier", "dispatcher"])
                .skip(skip)
                .limit(limit)
                .sort({ ["createdAt"]: sortOrder }) // Sort by the selected date field
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
    async myPickupDelivery(query: DeliveryQueryDTO, courier: User) {

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
        const sortOrder = sort ? (sort.toString() == 'true') ? 1 : -1 : -1; // 1 for ascending, -1 for descending

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
                { 'tracking_id': { $regex: searchQuery, $options: 'i' } },
                { 'pickup_address': { $regex: searchQuery, $options: 'i' } },
                { 'pickup_dept': { $regex: searchQuery, $options: 'i' } },
                { 'pickup_staff_name': { $regex: searchQuery, $options: 'i' } },
                { 'dropoff_address': { $regex: searchQuery, $options: 'i' } },
                { 'dropoff_dept': { $regex: searchQuery, $options: 'i' } },
                { 'dropoff_staff_name': { $regex: searchQuery, $options: 'i' } },
                { 'location': { $regex: searchQuery, $options: 'i' } },
                { 'recipient.email': { $regex: searchQuery, $options: 'i' } },
                { 'recipient.phone_number_1': { $regex: searchQuery, $options: 'i' } },
                { 'recipient.phone_number_2': { $regex: searchQuery, $options: 'i' } },
            ];
        }

        if (status) {
            mongoQuery.status = status;
        }

        mongoQuery.courier = new Types.ObjectId((<any>(<any>courier).id).toString())
        mongoQuery.isAccepted = true

        log(mongoQuery)

        try {
            const deliveries = await this.deliveryModel
                .find(mongoQuery)
                .populate(["courier", "dispatcher"])
                .skip(skip)
                .limit(limit)
                .sort({ ["createdAt"]: sortOrder }) // Sort by the selected date field
                .exec();

            const total = await this.deliveryModel.countDocuments(mongoQuery);

            const response_data = [];
            for (const delivery of deliveries) {
                let tracking = await this.trackingModel.findOne({ delivery: delivery.id });
                let data = { delivery };
                data["sessionId"] = tracking ? tracking.sessionId : null;
                response_data.push(data)
            }
            
            return {
                deliveries: response_data,
                page,
                limit,
                total,
            };

        } catch (error) {
            console.error("Error fetching deliveries:", error);
            throw new NotFoundException({ message: "Failed to retrieve deliveries" }); // Or handle the error as needed
        }
    }
    private async submitDelivery(tracking_id: string, dispatcher: User, slug: string) {

        const delivery: Delivery = await this.getDelivery(tracking_id, dispatcher);

        if (delivery.status != "pending") throw new ConflictException({ message: "Order is already been " + delivery.status });
        if (delivery.isCancelled) throw new ConflictException({ message: "This delivery has already been cancelled" });

        // const msg = `Hello\n You are receiving this email because you'll be receiving an order.\n Click this link ${process.env.BASE_URL}/delivery/accept/${slug} to confirm.`;

        // this.utilService.sendEmail(msg, "Delivery Notification", delivery.recipient.email);

        let couriers = await this.courierService.getActiveCourier();

        log({ couriers })

        couriers.forEach(courier => {
            const msg = `Hello ${courier.name}\n\nAn order is available for pickup, kindly check available orders to pick it up`;
            this.utilService.sendEmail(msg, "Delivery Alert !", courier.email, "box");
        })

        return {
            message: "Request has been sent to the recipient for approval",
            delivery
        }
    }
    async toggleDelivery(slug: string, action: ToogleDeliveryDTO) {

        let delivery_id = await this.userService.getDeliveryFromRecipientSlug(slug);
        let delivery = await this.deliveryModel.findById(delivery_id);
        let status = await this.userService.toogleDelivery(slug, action, delivery);

        if (status)
            await this.deliveryModel.findByIdAndUpdate((<any>delivery).id, { isAccepted: true });

        return await this.deliveryModel.findById((<any>delivery).id);

    }
    async acceptPickup(tracking_id: string, courier: User) {

        let delivery = await this.deliveryModel.findOne({ tracking_id });

        if (delivery.status != "pending") throw new ConflictException({ message: "This delivery is no longer waititng to be picked up" })
        if (!delivery) throw new NotFoundException({ message: "Delivery no longer fund" })
        if (!await this.deliveryModel.findByIdAndUpdate(delivery.id, { status: "in-transit", courier })) throw new ConflictException({ message: "Error picking up delivery" });

        let sessionId = uuidv4();
        let tracking = new this.trackingModel({ sessionId, delivery });

        await tracking.save();

        await this.userService.pickupDeliveryNotification(delivery, sessionId);

        return { delivery: await this.deliveryModel.findById(delivery.id), sessionId }
    }
    async getDeliveryStatistics(user: User, type: string) {
        // log({user})
        const now = new Date();
        const lastWeekStart = startOfWeek(subWeeks(now, 1), { locale: enUS });
        const lastWeekEnd = endOfWeek(subWeeks(now, 1), { locale: enUS });
        const userId = new Types.ObjectId((<any>user).id); // Convert user._id to ObjectId

        // Determine the field to filter by based on the 'type' parameter
        const typeField = type === 'courier' ? 'courier' : 'dispatcher';

        // Helper function to get counts with optional date range
        const getCounts = async (match: any = {}) => {
            return {
                total: await this.deliveryModel.countDocuments({ [typeField]: userId, ...match }).exec(),
                pending: await this.deliveryModel
                    .countDocuments({ [typeField]: userId, ...match, status: 'pending' })
                    .exec(),
                inTransit: await this.deliveryModel
                    .countDocuments({ [typeField]: userId, ...match, status: 'in-transit' })
                    .exec(),
                delivered: await this.deliveryModel
                    .countDocuments({ [typeField]: userId, ...match, status: 'delivered' })
                    .exec(),
                cancelled: await this.deliveryModel
                    .countDocuments({ [typeField]: userId, ...match, isCancelled: true })
                    .exec(),
            };
        };

        // Get current counts
        const currentCounts = await getCounts({ [typeField]: userId });

        // Get counts for the previous week
        const previousCounts = await getCounts({
            createdAt: { $gte: lastWeekStart, $lte: lastWeekEnd },
            [typeField]: userId, // Use the determined field
        });

        // Calculate percentage changes
        const calculatePercentageChange = (current: number, previous: number) => {
            if (previous === 0) return current === 0 ? 0 : 100;
            const change = ((current - previous) / previous) * 100;
            return Math.min(change, 100);
        };

        const percentageChanges = {
            total: calculatePercentageChange(currentCounts.total, previousCounts.total),
            pending: calculatePercentageChange(currentCounts.pending, previousCounts.pending),
            inTransit: calculatePercentageChange(currentCounts.inTransit, previousCounts.inTransit),
            delivered: calculatePercentageChange(currentCounts.delivered, previousCounts.delivered),
            cancelled: calculatePercentageChange(currentCounts.cancelled, previousCounts.cancelled),
        };

        // Get deliveries by time range
        const getDeliveriesByTimeRange = async (startDate: Date, endDate: Date) => {
            return this.deliveryModel
                .find({
                    createdAt: { $gte: startDate, $lte: endDate },
                    [typeField]: userId, // Use the determined field
                })
                .exec();
        };

        const getDeliveriesCountByTimeRange = async (startDate: Date, endDate: Date) => {
            return this.deliveryModel.countDocuments({
                createdAt: { $gte: startDate, $lte: endDate },
                [typeField]: userId, // Use the determined field
            }).exec();
        };

        // Yearly deliveries for the past 12 months
        const yearlyDeliveries = eachMonthOfInterval({
            start: subMonths(now, 11),
            end: now,
        }).map(async (date) => {
            const monthEnd = endOfMonth(date);
            const count = await getDeliveriesCountByTimeRange(date, monthEnd);
            return { month: format(date, 'MMMM', { locale: enUS }), count };
        });

        // Monthly deliveries
        const monthlyDeliveries = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) }).map(async (date) => {
            const dayEnd = addDays(date, 1);
            const count = await getDeliveriesCountByTimeRange(date, dayEnd);
            return { day: format(date, 'yyyy-MM-dd', { locale: enUS }), count };
        });

        // Weekly deliveries
        const weeklyDeliveries = eachDayOfInterval({
            start: startOfWeek(now, { locale: enGB }),
            end: endOfWeek(now, { locale: enGB }),
        }).map(async (date) => {
            const dayEnd = addDays(date, 1);
            const count = await getDeliveriesCountByTimeRange(date, dayEnd);
            console.log(`Debug: Date: ${format(date, 'yyyy-MM-dd', { locale: enUS })}`);
            return {
                day: format(date, 'EEEE', { locale: enUS }),
                date: format(date, 'yyyy-MM-dd', { locale: enUS }),
                count,
            };
        });

        const [yearlyCounts, monthlyCounts, weeklyCounts] = await Promise.all([
            Promise.all(yearlyDeliveries),
            Promise.all(monthlyDeliveries),
            Promise.all(weeklyDeliveries),
        ]);

        // Get latest 10 deliveries
        const latestDeliveries = await this.deliveryModel
            .find({ [typeField]: userId }) // Use the determined field
            .sort({ createdAt: -1 })
            .limit(10)
            .populate(['dispatcher', 'courier'])
            .exec();

        return {
            counts: currentCounts,
            percentageChanges,
            yearlyDeliveries: yearlyCounts,
            monthlyDeliveries: monthlyCounts,
            weeklyDeliveries: weeklyCounts,
            latestDeliveries,
        };
    }
    async getDeliveryStatisticsForAdmin() {
        // log({user})
        const now = new Date();
        const lastWeekStart = startOfWeek(subWeeks(now, 1), { locale: enUS });
        const lastWeekEnd = endOfWeek(subWeeks(now, 1), { locale: enUS });

        // Helper function to get counts with optional date range
        const getCounts = async (match: any = {}) => {
            return {
                total: await this.deliveryModel.countDocuments({  ...match }).exec(),
                pending: await this.deliveryModel
                    .countDocuments({  ...match, status: 'pending' })
                    .exec(),
                active: await this.deliveryModel
                    .countDocuments({  ...match, status: 'in-transit' })
                    .exec(),
                delivered: await this.deliveryModel
                    .countDocuments({  ...match, status: 'delivered' })
                    .exec(),
                cancelled: await this.deliveryModel
                    .countDocuments({...match, isCancelled: true })
                    .exec(),
                'active-couriers': await this.courierService.allActiveCourier()
            };
        };

        // Get current counts
        const currentCounts = await getCounts();

        // Get counts for the previous week
        const previousCounts = await getCounts({
            createdAt: { $gte: lastWeekStart, $lte: lastWeekEnd },
        });

        // Calculate percentage changes
        const calculatePercentageChange = (current: number, previous: number) => {
            if (previous === 0) return current === 0 ? 0 : 100;
            const change = ((current - previous) / previous) * 100;
            return Math.min(change, 100);
        };

        const percentageChanges = {
            total: calculatePercentageChange(currentCounts.total, previousCounts.total),
            pending: calculatePercentageChange(currentCounts.pending, previousCounts.pending),
            active: calculatePercentageChange(currentCounts.active, previousCounts.active),
            delivered: calculatePercentageChange(currentCounts.delivered, previousCounts.delivered),
            cancelled: calculatePercentageChange(currentCounts.cancelled, previousCounts.cancelled),
        };

        // Get deliveries by time range
        const getDeliveriesByTimeRange = async (startDate: Date, endDate: Date) => {
            return this.deliveryModel
                .find({
                    createdAt: { $gte: startDate, $lte: endDate },
                })
                .exec();
        };

        const getDeliveriesCountByTimeRange = async (startDate: Date, endDate: Date) => {
            return this.deliveryModel.countDocuments({
                createdAt: { $gte: startDate, $lte: endDate },
            }).exec();
        };

        // Yearly deliveries for the past 12 months
        const yearlyDeliveries = eachMonthOfInterval({
            start: subMonths(now, 11),
            end: now,
        }).map(async (date) => {
            const monthEnd = endOfMonth(date);
            const count = await getDeliveriesCountByTimeRange(date, monthEnd);
            return { month: format(date, 'MMMM', { locale: enUS }), count };
        });

        // Monthly deliveries
        const monthlyDeliveries = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) }).map(async (date) => {
            const dayEnd = addDays(date, 1);
            const count = await getDeliveriesCountByTimeRange(date, dayEnd);
            return { day: format(date, 'yyyy-MM-dd', { locale: enUS }), count };
        });

        // Weekly deliveries
        const weeklyDeliveries = eachDayOfInterval({
            start: startOfWeek(now, { locale: enGB }),
            end: endOfWeek(now, { locale: enGB }),
        }).map(async (date) => {
            const dayEnd = addDays(date, 1);
            const count = await getDeliveriesCountByTimeRange(date, dayEnd);
            console.log(`Debug: Date: ${format(date, 'yyyy-MM-dd', { locale: enUS })}`);
            return {
                day: format(date, 'EEEE', { locale: enUS }),
                date: format(date, 'yyyy-MM-dd', { locale: enUS }),
                count,
            };
        });

        const [yearlyCounts, monthlyCounts, weeklyCounts] = await Promise.all([
            Promise.all(yearlyDeliveries),
            Promise.all(monthlyDeliveries),
            Promise.all(weeklyDeliveries),
        ]);

        // Get latest 10 deliveries
        const latestDeliveries = await this.deliveryModel
            .find() // Use the determined field
            .sort({ createdAt: -1 })
            .limit(10)
            .populate(['dispatcher', 'courier'])
            .exec();

        const topCouriers = await this.userService.topCouriers();

        return {
            counts: currentCounts,
            percentageChanges,
            yearlyDeliveries: yearlyCounts,
            monthlyDeliveries: monthlyCounts,
            weeklyDeliveries: weeklyCounts,
            latestDeliveries,
            topCouriers
        };
    }
    async getDeliveryStatisticsForSupportStaff() {
        // log({user})
        const now = new Date();
        const lastWeekStart = startOfWeek(subWeeks(now, 1), { locale: enUS });
        const lastWeekEnd = endOfWeek(subWeeks(now, 1), { locale: enUS });

        // Helper function to get counts with optional date range
        const getCounts = async (match: any = {}) => {
            return {
                total: await this.deliveryModel.countDocuments({  ...match }).exec(),
                pending: await this.deliveryModel
                    .countDocuments({  ...match, status: 'pending' })
                    .exec(),
                active: await this.deliveryModel
                    .countDocuments({  ...match, status: 'in-transit' })
                    .exec(),
                delivered: await this.deliveryModel
                    .countDocuments({  ...match, status: 'delivered' })
                    .exec(),
                cancelled: await this.deliveryModel
                    .countDocuments({...match, isCancelled: true })
                    .exec(),
                'active-couriers': await this.courierService.allActiveCourier()
            };
        };

        // Get current counts
        const currentCounts = await getCounts();

        // Get counts for the previous week
        const previousCounts = await getCounts({
            createdAt: { $gte: lastWeekStart, $lte: lastWeekEnd },
        });

        // Calculate percentage changes
        const calculatePercentageChange = (current: number, previous: number) => {
            if (previous === 0) return current === 0 ? 0 : 100;
            const change = ((current - previous) / previous) * 100;
            return Math.min(change, 100);
        };

        const percentageChanges = {
            total: calculatePercentageChange(currentCounts.total, previousCounts.total),
            pending: calculatePercentageChange(currentCounts.pending, previousCounts.pending),
            active: calculatePercentageChange(currentCounts.active, previousCounts.active),
            delivered: calculatePercentageChange(currentCounts.delivered, previousCounts.delivered),
            cancelled: calculatePercentageChange(currentCounts.cancelled, previousCounts.cancelled),
        };

        // Get deliveries by time range
        // const getDeliveriesByTimeRange = async (startDate: Date, endDate: Date) => {
        //     return this.deliveryModel
        //         .find({
        //             createdAt: { $gte: startDate, $lte: endDate },
        //         })
        //         .exec();
        // };

        const getDeliveriesCountByTimeRange = async (startDate: Date, endDate: Date) => {
            return this.deliveryModel.countDocuments({
                createdAt: { $gte: startDate, $lte: endDate },
            }).exec();
        };

        // Yearly deliveries for the past 12 months
        const yearlyDeliveries = eachMonthOfInterval({
            start: subMonths(now, 11),
            end: now,
        }).map(async (date) => {
            const monthEnd = endOfMonth(date);
            const count = await getDeliveriesCountByTimeRange(date, monthEnd);
            return { month: format(date, 'MMMM', { locale: enUS }), count };
        });

        // Monthly deliveries
        const monthlyDeliveries = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) }).map(async (date) => {
            const dayEnd = addDays(date, 1);
            const count = await getDeliveriesCountByTimeRange(date, dayEnd);
            return { day: format(date, 'yyyy-MM-dd', { locale: enUS }), count };
        });

        // Weekly deliveries
        const weeklyDeliveries = eachDayOfInterval({
            start: startOfWeek(now, { locale: enGB }),
            end: endOfWeek(now, { locale: enGB }),
        }).map(async (date) => {
            const dayEnd = addDays(date, 1);
            const count = await getDeliveriesCountByTimeRange(date, dayEnd);
            console.log(`Debug: Date: ${format(date, 'yyyy-MM-dd', { locale: enUS })}`);
            return {
                day: format(date, 'EEEE', { locale: enUS }),
                date: format(date, 'yyyy-MM-dd', { locale: enUS }),
                count,
            };
        });

        const [yearlyCounts, monthlyCounts, weeklyCounts] = await Promise.all([
            Promise.all(yearlyDeliveries),
            Promise.all(monthlyDeliveries),
            Promise.all(weeklyDeliveries),
        ]);

        // Get latest 10 deliveries
        // const latestDeliveries = await this.deliveryModel
        //     .find() // Use the determined field
        //     .sort({ createdAt: -1 })
        //     .limit(10)
        //     .populate(['dispatcher', 'courier'])
        //     .exec();

        const topCouriers = await this.userService.topCouriers();

        let userStat = await this.userService.userStat();

        // userStat["pending_refund_request"] = await this.refundService.getLatestRefundRequest();

        return {
            // counts: currentCounts,
            yearlyDeliveries: yearlyCounts,
            monthlyDeliveries: monthlyCounts,
            weeklyDeliveries: weeklyCounts,
            userStat,
            topCouriers
        };
    }
    async viewAllDeliverySupportStaff(query: DeliveryQueryDTO) {

        const {
            page = 1,
            limit = 10,
            sort = true,
            canceled,
            date_filter_type,
            from_date,
            to_date,
            status,
            query: searchQuery
        } = query;

        log({ query })

        const skip = (page - 1) * limit;
        const sortOrder = sort ? (sort.toString() == 'true') ? 1 : -1 : -1; // 1 for ascending, -1 for descending

        const mongoQuery: any = canceled ? { isCancelled: canceled } : {}; // Filter by cancellation status

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
                { 'tracking_id': { $regex: searchQuery, $options: 'i' } },
                { 'pickup_address': { $regex: searchQuery, $options: 'i' } },
                { 'pickup_dept': { $regex: searchQuery, $options: 'i' } },
                { 'pickup_staff_name': { $regex: searchQuery, $options: 'i' } },
                { 'dropoff_address': { $regex: searchQuery, $options: 'i' } },
                { 'dropoff_dept': { $regex: searchQuery, $options: 'i' } },
                { 'dropoff_staff_name': { $regex: searchQuery, $options: 'i' } },
                { 'location': { $regex: searchQuery, $options: 'i' } },
                { 'recipient.email': { $regex: searchQuery, $options: 'i' } },
                { 'recipient.phone_number_1': { $regex: searchQuery, $options: 'i' } },
                { 'recipient.phone_number_2': { $regex: searchQuery, $options: 'i' } },
            ];
        }

        if (status) {
            mongoQuery.status = status;
        }


        log(mongoQuery)

        try {
            const deliveries = await this.deliveryModel
                .find(mongoQuery)
                .populate(["courier", "dispatcher"])
                .skip(skip)
                .limit(limit)
                .sort({ ["createdAt"]: sortOrder }) // Sort by the selected date field
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
    async recipientViewDelivery(sessionId: string) {
        let tracking = await this.trackingModel.findOne({ sessionId }).populate(["delivery"]).exec();
        if (!tracking) throw new NotFoundException({ message: "Could not get this delivery" });
        let delivery = await this.deliveryModel.findOne({ tracking_id: tracking.delivery.tracking_id }).populate(["dispatcher", "courier"]);
        return delivery;
    }
    async recipientViewAllDelivery(email: string, query: DeliveryQueryDTO) {

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
        const sortOrder = sort ? (sort.toString() == 'true') ? 1 : -1 : -1; // 1 for ascending, -1 for descending

        const mongoQuery: any = {
            isCancelled: canceled,
            // recipient: {
            //     email
            // }
        }; // Filter by cancellation status

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
                { 'tracking_id': { $regex: searchQuery, $options: 'i' } },
                { 'pickup_address': { $regex: searchQuery, $options: 'i' } },
                { 'pickup_dept': { $regex: searchQuery, $options: 'i' } },
                { 'pickup_staff_name': { $regex: searchQuery, $options: 'i' } },
                { 'dropoff_address': { $regex: searchQuery, $options: 'i' } },
                { 'dropoff_dept': { $regex: searchQuery, $options: 'i' } },
                { 'dropoff_staff_name': { $regex: searchQuery, $options: 'i' } },
                { 'location': { $regex: searchQuery, $options: 'i' } },
            ];
        }

        if (status) {
            mongoQuery.status = "pending";
        }

        mongoQuery["recipient.email"] = email;

        log(mongoQuery)

        try {
            const deliveries = await this.deliveryModel
                .find({ ...mongoQuery })
                .populate(["courier", "dispatcher"])
                .skip(skip)
                .limit(limit)
                .sort({ ["createdAt"]: sortOrder }) // Sort by the selected date field
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
    async confirmDeliverySubmission (sessionId: string) {
        let delivery = await this.viewDeliveryBySessionId(sessionId);
        await this.deliveryModel.findByIdAndUpdate((<any> delivery).id, { status: "delivered" });
        let new_delivery = await this.deliveryModel.findById((<any> delivery).id).populate("courier");
        this.userService.notifyCourier(new_delivery.courier)
        return {
            message: "Delivery accepted successfully",
            data: new_delivery
        }
    }
}