import { Inject, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { IssuesAndReport, IssuesAndReportDocument } from './issues.schema/issues.schema';
import { Model, Types } from 'mongoose';
import { User } from '../user/user.schema/user.schema';
import { Delivery } from '../delivery/delivery.schema/delivery.schema';
import { OpenIssuesDTO, UpdateIssuesDTO } from './issues.dto/issues.dto';
import { log } from 'console';
import { DeliveryService } from '../delivery/delivery.service';
import { UserService } from '../user/user.service';

@Injectable()
export class IssuesService {
    // This service can be expanded with methods to handle issues and reports
    // For example, methods to create, update, delete, and retrieve issues
    // You can also inject repositories or models here to interact with the database

    constructor(
        @Inject() private readonly userService: UserService,
        @Inject() private readonly deliveryService: DeliveryService,
        @InjectModel(IssuesAndReport.name) private readonly issuesModel: Model<IssuesAndReportDocument>
    ) { }


    async createIssue(issueData: OpenIssuesDTO, user: User, trackingId: string) {

        let delivery = await this.deliveryService.viewDeliveryByTrackingID(trackingId);

        let count: number = await this.issuesModel.countDocuments()
        count += 1;

        const tracking_id = "ISS" + String(count).padStart(4, '0');

        const newIssue = new this.issuesModel({ ...issueData, tracking_id, user: (<any>user).id, delivery: (<any>delivery).id, status: "open" });
        await newIssue.save()

        let data = await this.issuesModel.findOne({ tracking_id }).populate("user").populate("delivery");

        return {
            data: data,
            message: "Issue opened successfully"
        }
    }

    async viewIssue(tracking_id: string) {
        // Logic to retrieve a specific issue by tracking_id from the database
        const issue = await this.issuesModel.findOne({ tracking_id }).populate("user").populate("delivery");
        if (!issue) {
            throw new NotFoundException(`Issue with tracking ID ${tracking_id} not found`);
        }
        return issue;
    }
    async getAllIssues(query: any) {
        const {
            page = 1,
            limit = 10,
            sort = true,
            date_filter_type, // This seems unused in the existing date filtering logic
            from_date,
            to_date,
            type,
            status,
            query: searchQuery
        } = query;

        log({ query });

        const skip = (page - 1) * limit;
        const sortOrder = sort ? (sort.toString() === 'true') ? 1 : -1 : -1; // 1 for ascending, -1 for descending

        const mongoQuery: any = {}; // Initialize the main MongoDB query object

        // Date filtering (assuming 'createdAt' is the relevant date field)
        if (date_filter_type && from_date && to_date) {
            const dateField = 'createdAt';
            mongoQuery[dateField] = {
                $gte: new Date(from_date),
                $lte: new Date(to_date),
            };
        }

        // --- Dynamic filtering based on search query ---
        const orConditions: any[] = [];

        if (searchQuery) {
            // 1. Search by tracking_id directly on the Issue model (if 'tracking_id' exists on Issue)
            //    Note: If 'Issue' schema doesn't have 'tracking_id', remove this line or adjust
            orConditions.push({ 'tracking_id': { $regex: searchQuery, $options: 'i' } });

            // 2. Search related User documents (by email, name, role) and add their IDs to the query
            const userSearchQuery: any = {
                $or: [
                    { 'email': { $regex: searchQuery, $options: 'i' } },
                    { 'name': { $regex: searchQuery, $options: 'i' } },
                    { 'role': { $regex: searchQuery, $options: 'i' } },
                ]
            };
            const users = await this.userService.getUsers(userSearchQuery) // Select only _id
            const userIds = users.map(user => user._id);

            if (userIds.length > 0) {
                orConditions.push({ 'user': { $in: userIds } });
            }

            // 3. Search related Delivery documents by tracking_id and add their IDs to the query
            const deliverySearchQuery: any = { 'tracking_id': { $regex: searchQuery, $options: 'i' } };
            const deliveries = await this.deliveryService.getDeliveries(deliverySearchQuery); // Select only _id
            const deliveryIds = deliveries.map(delivery => delivery._id);

            if (deliveryIds.length > 0) {
                orConditions.push({ 'delivery': { $in: deliveryIds } });
            }

            // Apply $or conditions if any were generated
            if (orConditions.length > 0) {
                mongoQuery.$or = orConditions;
            }
        }
        // --- End of dynamic filtering ---

        // Filter by 'type' (assuming 'type' field exists on your Issue schema)
        if (type) {
            mongoQuery.type = type;
        }

        // Filter by 'status' (assuming 'status' field exists on your Issue schema)
        if (status) {
            mongoQuery.status = status;
        }

        log(mongoQuery);

        const issues = await this.issuesModel
            .find(mongoQuery)
            .populate(["user", "delivery"]) // Populate referenced user and delivery details
            .skip(skip)
            .limit(limit)
            .sort({ ["createdAt"]: sortOrder }) // Sort by the selected date field
            .exec();

        const total = await this.issuesModel.countDocuments(mongoQuery);
        return {
            issues,
            page,
            limit,
            total,
        };
    }
    async getMyAllIssues(user: User, query: any) {
        const {
            page = 1,
            limit = 10,
            sort = true,
            date_filter_type,
            from_date,
            to_date,
            type,
            status,
            query: searchQuery
        } = query;

        log({ query });

        const skip = (page - 1) * limit;
        const sortOrder = sort ? (sort.toString() === 'true') ? 1 : -1 : -1; // 1 for ascending, -1 for descending

        const mongoQuery: any = {}; // Initialize the main MongoDB query object

        // Filter issues by the provided user's ID
        // Ensure that user.id is correctly an ObjectId for the query
        mongoQuery["user"] = new Types.ObjectId((user as any)._id); // Assuming user._id is the MongoDB ID


        // Date filtering (assuming 'createdAt' is the relevant date field)
        if (date_filter_type && from_date && to_date) {
            const dateField = 'createdAt';
            mongoQuery[dateField] = {
                $gte: new Date(from_date),
                $lte: new Date(to_date),
            };
        }

        // --- Dynamic filtering based on search query ---
        const orConditions: any[] = [];

        if (searchQuery) {
            // 1. Search by tracking_id directly on the Issue model (if 'tracking_id' exists on Issue)
            orConditions.push({ 'tracking_id': { $regex: searchQuery, $options: 'i' } });

            // 2. Search related User documents (by email, name, role) and add their IDs to the query
            //    Note: This search applies to other users, the primary filter is by the current 'user'
            const userSearchQuery: any = {
                $or: [
                    { 'email': { $regex: searchQuery, $options: 'i' } },
                    { 'name': { $regex: searchQuery, $options: 'i' } },
                    { 'role': { $regex: searchQuery, $options: 'i' } },
                ]
            };
            const users = await this.userService.getUsers(userSearchQuery) // Select only _id
            const userIds = users.map(user => user._id);

            // Only add to $or if the search query is for *other* users,
            // and if the current user ID is not already covered by this
            if (userIds.length > 0) {
                orConditions.push({ 'user': { $in: userIds } });
            }

            // 3. Search related Delivery documents by tracking_id and add their IDs to the query
            const deliverySearchQuery: any = { 'tracking_id': { $regex: searchQuery, $options: 'i' } };
            const deliveries = await this.deliveryService.getDeliveries(deliverySearchQuery); // Select only _id
            const deliveryIds = deliveries.map(delivery => delivery._id);

            if (deliveryIds.length > 0) {
                orConditions.push({ 'delivery': { $in: deliveryIds } });
            }

            // Apply $or conditions if any were generated
            // IMPORTANT: Ensure the specific user filter (mongoQuery["user"]) is combined correctly with $or.
            // If $or is present, it means complex search. The 'user' filter should logically AND with it.
            if (orConditions.length > 0) {
                if (mongoQuery.$and) {
                    mongoQuery.$and.push({ $or: orConditions });
                } else {
                    mongoQuery.$and = [{ $or: orConditions }];
                }
            }
        }
        // --- End of dynamic filtering ---

        // Filter by 'type' (assuming 'type' field exists on your Issue schema)
        if (type) {
            mongoQuery.type = type;
        }

        // Filter by 'status' (assuming 'status' field exists on your Issue schema)
        if (status) {
            mongoQuery.status = status;
        }

        log({ user });
        log(mongoQuery);


        const issues = await this.issuesModel
            .find(mongoQuery)
            .populate(["user", "delivery"]) // Populate referenced user and delivery details
            .skip(skip)
            .limit(limit)
            .sort({ ["createdAt"]: sortOrder }) // Sort by the selected date field
            .exec();

        const total = await this.issuesModel.countDocuments(mongoQuery);
        return {
            issues,
            page,
            limit,
            total,
        };
    }
    async updateIssueStatus(data: UpdateIssuesDTO, tracking_id: string) {
        // Logic to update the status of an issue by tracking_id
        const issue = await this.issuesModel.findOneAndUpdate(
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
}
