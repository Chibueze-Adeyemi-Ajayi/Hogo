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
            date_filter_type,
            from_date,
            to_date,
            type,
            status,
            query: searchQuery
        } = query;

        log({ query })

        const skip = (page - 1) * limit;
        const sortOrder = sort ? (sort.toString() == 'true') ? 1 : -1 : -1; // 1 for ascending, -1 for descending

        const mongoQuery: any = {}; // Filter by cancellation status

        // Date filtering
        if (date_filter_type && from_date && to_date) {
            const dateField = 'createdAt';
            mongoQuery[dateField] = {
                $gte: new Date(from_date),
                $lte: new Date(to_date),
            };
        }

        // Full-text search
        if (searchQuery) {
            mongoQuery.$or = [
                { 'tracking_id': { $regex: searchQuery, $options: 'i' } },
                { 'user.email': { $regex: searchQuery, $options: 'i' } },
                { 'user.name': { $regex: searchQuery, $options: 'i' } },
                { 'user.role': { $regex: searchQuery, $options: 'i' } },
                { 'delivery.tracking_id': { $regex: searchQuery, $options: 'i' } },
            ];
        }

        if (type) {
            mongoQuery.type = type;
        }

        if (status) {
            mongoQuery.status = status;
        }

        log(mongoQuery)

        const issues = await this.issuesModel
            .find(mongoQuery)
            .populate(["user", "delivery"])
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

        log({ query })

        const skip = (page - 1) * limit;
        const sortOrder = sort ? (sort.toString() == 'true') ? 1 : -1 : -1; // 1 for ascending, -1 for descending

        const mongoQuery: any = {}; // Filter by cancellation status

        // Date filtering
        if (date_filter_type && from_date && to_date) {
            const dateField = 'createdAt';
            mongoQuery[dateField] = {
                $gte: new Date(from_date),
                $lte: new Date(to_date),
            };
        }

        // Full-text search
        if (searchQuery) {
            mongoQuery.$or = [
                { 'tracking_id': { $regex: searchQuery, $options: 'i' } },
                { 'user.email': { $regex: searchQuery, $options: 'i' } },
                { 'user.name': { $regex: searchQuery, $options: 'i' } },
                { 'user.role': { $regex: searchQuery, $options: 'i' } },
                { 'delivery.tracking_id': { $regex: searchQuery, $options: 'i' } },
            ];
        }

        if (type) {
            mongoQuery.type = type;
        }

        if (status) {
            mongoQuery.status = status;
        }

        log({user});

        mongoQuery["user"] = new Types.ObjectId((<any>user).id).toString(); // Filter by user ID

        const issues = await this.issuesModel
            .find(mongoQuery)
            .populate(["user", "delivery"])
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
    async updateIssueStatus (data: UpdateIssuesDTO, tracking_id: string) {
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
