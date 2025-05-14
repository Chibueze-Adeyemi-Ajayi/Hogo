import { ConflictException, Inject, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
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

@Injectable()
export class DeliveryService {
    constructor(
        @Inject() private readonly userService: UserService,
        @Inject() private readonly utilService: UtilsService,
        @InjectModel(Delivery.name) private readonly deliveryModel: Model<DeliveryDocument>
    ) { }
    private async getDelivery(tracking_id: string, dispatcher: User) {
        let delivery = await this.deliveryModel.findOne({ tracking_id }).populate(["dispatcher", "courier"]).exec();
        if (!delivery) throw new NotFoundException({ message: `Delivery with Tracking ID ${tracking_id} not found` });
        log({ dispatcher });

        // if (delivery.courier.toString().trim() == (<any>dispatcher).id.toString().trim()) return delivery
        // if (delivery.dispatcher.toString().trim() == (<any>dispatcher).id.toString().trim()) return delivery

        return delivery;

        // log({ delivery })

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

        let price = parseInt(data.distance) * parseInt(process.env.UNIT_PRICE_PER_KM)

        let delivery = new this.deliveryModel({ ...data, tracking_id, price, dispatcher, recipient });

        await delivery.save();

        const stacked_delivery = await this.deliveryModel.findById(delivery.id)

        log({ stacked_delivery });

        // await this.deliveryModel.findByIdAndUpdate(delivery.id, { dispatcher })

        const slug = await this.userService.stackRecipient(stacked_delivery);

        if (!slug) throw new ConflictException({ message: "Unable to add recipient" })

        await this.submitDelivery(delivery.tracking_id, dispatcher, slug);

        return await this.deliveryModel.findById(delivery.id);
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
    async cancelDelivery(data: CancelDeliveryDTO, tracking_id: string, dispatcher: User) {
        let delivery = await this.getDelivery(tracking_id, dispatcher);

        if (delivery.active) throw new UnauthorizedException({ message: "This delivery is already in service" })

        await this.deliveryModel.findByIdAndUpdate(delivery.id, { ...data, status: "cancelled", isCancelled: true });

        return await this.deliveryModel.findById(delivery.id);
    }
    async viewDelivery(tracking_id: string, dispatcher: User) {
        return await this.getDelivery(tracking_id, dispatcher);
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
            mongoQuery.status = "pending";
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
    private async submitDelivery(tracking_id: string, dispatcher: User, slug: string) {

        const delivery: Delivery = await this.getDelivery(tracking_id, dispatcher);

        if (delivery.status != "pending") throw new ConflictException({ message: "Order is already been " + delivery.status });
        if (delivery.isCancelled) throw new ConflictException({ message: "This delivery has already been cancelled" });

        const msg = `Hello\n You are receiving this email because you'll be receiving an order.\n Click this link ${process.env.BASE_URL}/delivery/accept/${slug} to confirm.`;

        this.utilService.sendEmail(msg, "Delivery Notification", delivery.recipient.email);

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
        await this.userService.pickupDeliveryNotification(delivery);
        return await this.deliveryModel.findById(delivery.id)
    }
    async getDeliveryStatistics() {
        const now = new Date();
        const lastWeekStart = startOfWeek(subWeeks(now, 1), { locale: enUS });
        const lastWeekEnd = endOfWeek(subWeeks(now, 1), { locale: enUS });

        // Helper function to get counts with optional date range
        const getCounts = async (match: any = {}) => {
            return {
                total: await this.deliveryModel.countDocuments(match).exec(),
                pending: await this.deliveryModel.countDocuments({ ...match, status: 'pending' }).exec(),
                inTransit: await this.deliveryModel.countDocuments({ ...match, status: 'in-transit' }).exec(),
                delivered: await this.deliveryModel.countDocuments({ ...match, status: 'delivered' }).exec(),
                cancelled: await this.deliveryModel.countDocuments({ ...match, isCancelled: true }).exec(),
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
            if (previous === 0) return current === 0 ? 0 : 100; // Handle the case where previous is 0
            const change = ((current - previous) / previous) * 100;
            return Math.min(change, 100); // Ensure percentage change is not greater than 100%
        };

        const percentageChanges = {
            total: calculatePercentageChange(currentCounts.total, previousCounts.total),
            pending: calculatePercentageChange(currentCounts.pending, previousCounts.pending),
            inTransit: calculatePercentageChange(currentCounts.inTransit, previousCounts.pending),
            delivered: calculatePercentageChange(currentCounts.delivered, previousCounts.delivered),
            cancelled: calculatePercentageChange(currentCounts.cancelled, previousCounts.cancelled),
        };

        // Get deliveries by time range
        const getDeliveriesByTimeRange = async (startDate: Date, endDate: Date) => {
            return this.deliveryModel.find({
                createdAt: {
                    $gte: startDate,
                    $lte: endDate,
                },
            }).exec();
        };

        const getDeliveriesCountByTimeRange = async (startDate: Date, endDate: Date) => {
            return this.deliveryModel.countDocuments({
                createdAt: {
                    $gte: startDate,
                    $lte: endDate,
                },
            }).exec();
        };

        // Yearly deliveries for the past 12 months
        const yearlyDeliveries = eachMonthOfInterval({
            start: subMonths(now, 11), // Start 11 months ago
            end: now,
        }).map(async (date) => {
            const monthEnd = endOfMonth(date);
            const count = await getDeliveriesCountByTimeRange(date, monthEnd);
            return { month: format(date, 'MMMM', { locale: enUS }), count };
        });

        // Fix: Monthly deliveries should count per day of the month
        const monthlyDeliveries = eachDayOfInterval({ start: startOfMonth(now), end: endOfMonth(now) }).map(async (date) => {
            const dayEnd = addDays(date, 1);
            const count = await getDeliveriesCountByTimeRange(date, dayEnd);
            return { day: format(date, 'yyyy-MM-dd', { locale: enUS }), count }; // Use ISO format
        });

        // Ensure weekly deliveries are Monday to Sunday
        const weeklyDeliveries = eachDayOfInterval({
            start: startOfWeek(now, { locale: enGB }), // Use enGB locale to start on Monday
            end: endOfWeek(now, { locale: enGB }),
        }).map(async (date) => {
            const dayEnd = addDays(date, 1); // Add one day to the end day
            const count = await getDeliveriesCountByTimeRange(date, dayEnd);
            console.log(`Debug: Date: ${format(date, 'yyyy-MM-dd', { locale: enUS })}`); // Log the date
            return {
                day: format(date, 'EEEE', { locale: enUS }),
                date: format(date, 'yyyy-MM-dd', { locale: enUS }),
                count,
            }; // Include the day of the week
        });

        const [yearlyCounts, monthlyCounts, weeklyCounts] = await Promise.all([
            Promise.all(yearlyDeliveries),
            Promise.all(monthlyDeliveries),
            Promise.all(weeklyDeliveries),
        ]);

        // Get latest 10 deliveries
        const latestDeliveries = await this.deliveryModel
            .find()
            .sort({ createdAt: -1 }) // Sort by createdAt in descending order
            .limit(10)
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
}