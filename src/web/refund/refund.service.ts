import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Refund, RefundDocument } from './refund.schema/refund.schema';
import { Model, Types } from 'mongoose';
import { OpenRefundDTO, UpdateRefundDTO } from './refund.dto/refund.dto';
import { User } from '../user/user.schema/user.schema';
import { UserService } from '../user/user.service';
import { DeliveryService } from '../delivery/delivery.service';
import { log } from 'console';
import {
    subDays,
    startOfDay,
    endOfDay,
    format,
} from 'date-fns';

@Injectable()
export class RefundService {

    constructor(
        @Inject() private readonly userService: UserService,
        @Inject() private readonly deliveryService: DeliveryService,
        @InjectModel(Refund.name) private readonly refundModel: Model<RefundDocument>
    ) { }


    async openRefundRequest(issueData: OpenRefundDTO, user: User, deliveryTrackingId: string) {

        let delivery = await this.deliveryService.viewDeliveryByTrackingID(deliveryTrackingId);

        let count: number = await this.refundModel.countDocuments()
        count += 1;

        const tracking_id = "RFD" + String(count).padStart(4, '0');

        const newIssue = new this.refundModel({ ...issueData, tracking_id, user: (<any>user).id, delivery: (<any>delivery).id, status: "pending" });
        await newIssue.save()

        let data = await this.refundModel.findOne({ tracking_id }).populate("user").populate("delivery");

        return {
            data: data,
            message: "Issue opened successfully"
        }
    }

    async viewRefund(tracking_id: string) {
        // Logic to retrieve a specific issue by tracking_id from the database
        const issue = await this.refundModel.findOne({ tracking_id }).populate("user").populate("delivery");
        if (!issue) {
            throw new NotFoundException(`Issue with tracking ID ${tracking_id} not found`);
        }
        return issue;
    }

    async getAllRefundRequests(query: any) {

        const {
            page = 1,
            limit = 10,
            sort = true,
            date_filter_type, // This seems unused in the existing date filtering logic
            from_date,
            to_date,
            type, // This 'type' field is not in your Refund schema, adjust as needed
            status,
            query: searchQuery
        } = query;

        log({ query });

        const skip = (page - 1) * limit;
        const sortOrder = sort ? (sort.toString() === 'true') ? 1 : -1 : -1; // 1 for ascending, -1 for descending

        const mongoQuery: any = {}; // Filter by cancellation status

        // Date filtering
        if (date_filter_type && from_date && to_date) {
            const dateField = 'createdAt'; // Assuming 'createdAt' is the relevant date field for filtering
            mongoQuery[dateField] = {
                $gte: new Date(from_date),
                $lte: new Date(to_date),
            };
        }

        // --- Dynamic filtering based on search query ---
        const orConditions: any[] = [];

        if (searchQuery) {
            // 1. Search by tracking_id directly on Refund model
            orConditions.push({ 'tracking_id': { $regex: searchQuery, $options: 'i' } });

            // 2. Search related User documents and add their IDs to the query
            const userSearchQuery: any = {
                $or: [
                    { 'email': { $regex: searchQuery, $options: 'i' } },
                    { 'name': { $regex: searchQuery, $options: 'i' } },
                    { 'role': { $regex: searchQuery, $options: 'i' } },
                ]
            };
            const users = await this.userService.getUsers(userSearchQuery);
            const userIds = users.map(user => user._id);

            if (userIds.length > 0) {
                orConditions.push({ 'user': { $in: userIds } });
            }

            // 3. Search related Delivery documents by tracking_id and add their IDs to the query
            const deliverySearchQuery: any = { 'tracking_id': { $regex: searchQuery, $options: 'i' } };
            const deliveries = await this.deliveryService.getDeliveries(deliverySearchQuery);
            const deliveryIds = deliveries.map(delivery => delivery._id);

            if (deliveryIds.length > 0) {
                orConditions.push({ 'delivery': { $in: deliveryIds } });
            }

            if (orConditions.length > 0) {
                mongoQuery.$or = orConditions;
            }
        }
        // --- End of dynamic filtering ---


        // This 'type' field is not present in your Refund schema.
        // Ensure you add it to your Refund schema if you intend to filter by it.
        // Otherwise, this condition will always filter out results.
        if (type) {
            mongoQuery.type = type;
        }

        if (status) {
            mongoQuery.status = status;
        }

        log(mongoQuery);

        const issues = await this.refundModel
            .find(mongoQuery)
            .populate(["user", "delivery"]) // Populate still happens here for the final return
            .skip(skip)
            .limit(limit)
            .sort({ ["createdAt"]: sortOrder }) // Sort by the selected date field
            .exec();

        const total = await this.refundModel.countDocuments(mongoQuery);
        return {
            issues,
            page,
            limit,
            total,
        };
    }

    async getMyRefundRequests(user: User, query: any) {

        const {
            page = 1,
            limit = 10,
            sort = true,
            date_filter_type, // This seems unused in the existing date filtering logic
            from_date,
            to_date,
            type, // This 'type' field is not in your Refund schema, adjust as needed
            status,
            query: searchQuery
        } = query;

        log({ query });

        const skip = (page - 1) * limit;
        const sortOrder = sort ? (sort.toString() === 'true') ? 1 : -1 : -1; // 1 for ascending, -1 for descending

        const mongoQuery: any = {}; // Filter by cancellation status

        // Date filtering
        if (date_filter_type && from_date && to_date) {
            const dateField = 'createdAt'; // Assuming 'createdAt' is the relevant date field for filtering
            mongoQuery[dateField] = {
                $gte: new Date(from_date),
                $lte: new Date(to_date),
            };
        }

        // --- Dynamic filtering based on search query ---
        const orConditions: any[] = [];

        if (searchQuery) {
            // 1. Search by tracking_id directly on Refund model
            orConditions.push({ 'tracking_id': { $regex: searchQuery, $options: 'i' } });

            // 2. Search related User documents and add their IDs to the query
            const userSearchQuery: any = {
                $or: [
                    { 'email': { $regex: searchQuery, $options: 'i' } },
                    { 'name': { $regex: searchQuery, $options: 'i' } },
                    { 'role': { $regex: searchQuery, $options: 'i' } },
                ]
            };
            const users = await this.userService.getUsers(userSearchQuery);
            const userIds = users.map(user => user._id);

            if (userIds.length > 0) {
                orConditions.push({ 'user': { $in: userIds } });
            }

            // 3. Search related Delivery documents by tracking_id and add their IDs to the query
            const deliverySearchQuery: any = { 'tracking_id': { $regex: searchQuery, $options: 'i' } };
            const deliveries = await this.deliveryService.getDeliveries(deliverySearchQuery);
            const deliveryIds = deliveries.map(delivery => delivery._id);

            if (deliveryIds.length > 0) {
                orConditions.push({ 'delivery': { $in: deliveryIds } });
            }

            if (orConditions.length > 0) {
                mongoQuery.$or = orConditions;
            }
        }
        // --- End of dynamic filtering ---


        // This 'type' field is not present in your Refund schema.
        // Ensure you add it to your Refund schema if you intend to filter by it.
        // Otherwise, this condition will always filter out results.
        if (type) {
            mongoQuery.type = type;
        }

        if (status) {
            mongoQuery.status = status;
        }

        log(mongoQuery);

        mongoQuery["user"] = new Types.ObjectId((<any>user).id).toString(); // Filter by user ID

        const issues = await this.refundModel
            .find(mongoQuery)
            .populate(["user", "delivery"]) // Populate still happens here for the final return
            .skip(skip)
            .limit(limit)
            .sort({ ["createdAt"]: sortOrder }) // Sort by the selected date field
            .exec();

        const total = await this.refundModel.countDocuments(mongoQuery);
        return {
            issues,
            page,
            limit,
            total,
        };
    }

    async updateRefundStatus(data: UpdateRefundDTO, tracking_id: string) {
        // Logic to update the status of an issue by tracking_id
        const issue = await this.refundModel.findOneAndUpdate(
            { tracking_id },
            { status: data.status },
            { new: true }
        ).populate("user").populate("delivery");

        if (!issue) {
            throw new NotFoundException(`Issue with tracking ID ${tracking_id} not found`);
        }

        let user = issue.user;
        this.userService.emailUser(user.email, "Issue Status Updated", `Your issue with tracking ID ${tracking_id} has been updated to status: ${data.status}`);

        return {
            data: issue,
            message: "Issue status updated successfully"
        };

    }
    private async getDistinctPendingUsersCount(startDate: Date, endDate: Date): Promise<number> {
        const matchQuery: any = {
            status: "pending",
            createdAt: {
                $gte: startDate,
                $lte: endDate,
            },
        };

        // Use aggregation to get distinct users and then count them
        const result = await this.refundModel.aggregate([
            { $match: matchQuery },
            { $group: { _id: "$user" } }, // Group by user to get distinct users
            { $count: "distinctUsersCount" } // Count the distinct users
        ]).exec();

        return result.length > 0 ? result[0].distinctUsersCount : 0;
    }

    /**
     * Calculates the count of distinct users with pending refunds
     * and their percentage change over the last 7 days.
     *
     * @returns A promise that resolves to an object containing current counts and percentage changes.
     */
    async distinctRefundStatuses() {
        const now = new Date();

        // Define the current 7-day period (e.g., last 7 full days from now)
        const currentPeriodStart = startOfDay(subDays(now, 7)); // Start of the current 7-day window
        const currentPeriodEnd = now; // Up to the current moment

        // Define the previous 7-day period (the 7 days immediately before the currentPeriodStart)
        const previousPeriodEnd = startOfDay(subDays(currentPeriodStart, 1)); // End of the day before current period started
        const previousPeriodStart = startOfDay(subDays(previousPeriodEnd, 6)); // 7 days before previousPeriodEnd

        log(`Current Period for Refunds: ${format(currentPeriodStart, 'yyyy-MM-dd')} to ${format(currentPeriodEnd, 'yyyy-MM-dd HH:mm:ss')}`);
        log(`Previous Period for Refunds: ${format(previousPeriodStart, 'yyyy-MM-dd')} to ${format(previousPeriodEnd, 'yyyy-MM-dd HH:mm:ss')}`);

        // --- Fetch counts for the CURRENT 7-day period ---
        const distinctPendingUsersCurrent = await this.getDistinctPendingUsersCount(currentPeriodStart, currentPeriodEnd);

        // --- Fetch counts for the PREVIOUS 7-day period ---
        const distinctPendingUsersPrevious = await this.getDistinctPendingUsersCount(previousPeriodStart, previousPeriodEnd);

        // Helper to calculate percentage change
        const calculatePercentageChange = (current: number, previous: number): number => {
            if (previous === 0) {
                return current > 0 ? 100 : 0; // If previous was 0 and current is > 0, it's 100% growth (or 0 if still 0)
            }
            return parseFloat(((current - previous) / previous * 100).toFixed(2)); // To 2 decimal places
        };

        return {
            current_counts: {
                users_with_pending_refunds: distinctPendingUsersCurrent,
            },
            percentage_change_last_week: {
                users_with_pending_refunds: calculatePercentageChange(distinctPendingUsersCurrent, distinctPendingUsersPrevious),
            },
        };
    }
    async getLatestRefundRequest() {
        // Logic to retrieve the latest refund request for a user
        const latestRefund = await this.refundModel.find({ status: "pending" }).sort({ createdAt: -1 }).populate("user").populate("delivery");
        return latestRefund
    }
}
