import { ConflictException, Inject, Injectable, Logger, NotAcceptableException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChangePasswordDTO, RequestOTP, ToogleDeliveryDTO, UpdatePasswordDTO, UpdateUserDto, UserAccountStatusUpdateDTO, UserDto, UserSignInDTO, ValidateOTP } from './user.dto/user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './user.schema/user.schema';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { UserOTP, UserOTPDocument } from './user.schema/user.otp.schema';
import { UtilsService } from 'src/common/utils/utils.service';
import { Delivery } from '../delivery/delivery.schema/delivery.schema';
import { Recipient, RecipientDocument } from './user.schema/recipient.schema';
import { log } from 'console';
import { NotificationDocument, Notification } from './user.schema/user.notification.schema';
import { AdminNotificationDto, NotificationDto } from './user.dto/user.notification.dto';
import { CourierOnDutyModeDTO } from '../courier/courier.dto/courier.dto';
import { MicrosoftAzureService } from 'src/third-party/microsoft-azure/microsoft-azure.service';
import { LoginHistory, LoginHistoryDocument } from './user.schema/login.history.schema';
import { AdminNotification } from './user.schema/user.admin.notification.schema';
import {
    subDays,
    startOfDay,
    endOfDay,
    format,
} from 'date-fns';
@Injectable()
export class UserService {
    private logger = new Logger(UserService.name)
    constructor(
        @Inject() private readonly jwtService: JwtService,
        @Inject() private readonly utilService: UtilsService,
        // @Inject() private readonly utilService: UtilsService,
        @Inject() private readonly microsoftAzureService: MicrosoftAzureService,
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        @InjectModel(UserOTP.name) private readonly userOTPModel: Model<UserOTPDocument>,
        @InjectModel(Recipient.name) private readonly recipientModel: Model<RecipientDocument>,
        @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
        @InjectModel(LoginHistory.name) private readonly loginHistoryModel: Model<LoginHistoryDocument>,
        @InjectModel(AdminNotification.name) private readonly adminNotificationModel: Model<AdminNotification>,
    ) { }

    async getUserByJWT(jwt: string) {
        return await this.userModel.findOne({ token: jwt });
    }

    async getUserByJWTViaAuthGuard(jwt: string) {
        return await this.userModel.findOne({ token: jwt }).select(["password", "admin_id"]).exec();
    }

    async updateNumOfDeliveryCreated(num: number, user: User) {
        await this.userModel.findByIdAndUpdate((<any>user).id, { total_delivery_created: num })
    }

    async signUp(data: UserDto) {

        this.logger.log("User signin") 

        if (data.admin_id) {
            if (data.role.toLowerCase() == "supportstaff") {
                if (data.admin_id != process.env.SUPPORT_STAFF_ADMIN_ID) throw new UnauthorizedException({ message: "You just entered the wrong Admin ID for a support staff" });
            } else if (data.admin_id != process.env.ADMIN_ID) throw new UnauthorizedException({ message: "Incorrect Admin ID" });
        }

        let existing_email = await this.userModel.findOne({ email: data.email });
        if (existing_email) throw new ConflictException({ message: "Email already exists" });

        // let existing_staff_number = await this.userModel.findOne({ staff_number: data.staff_number });
        // if (existing_staff_number) throw new ConflictException({ message: "Staff number already exists" });

        const saltOrRounds = parseInt(process.env.BYCRYPT_SALT);
        const hash = await bcrypt.hash(data.password, saltOrRounds);

        data.password = hash;

        let user = new this.userModel(data);
        await user.save();

        const payload = { sub: user.id, username: user.email };
        let jwt_secret = await this.jwtService.signAsync(payload, {
            secret: process.env.JWT_SECRET,
        })

        await this.userModel.findByIdAndUpdate(user.id, { token: jwt_secret })

        delete data["password"]

        return {
            message: "Account creation successful",
            data,
            jwt_secret
        }
    }

    private async isJWTActive(jwt: string) {
        try {
            await this.jwtService.verifyAsync(
                jwt, { secret: process.env.JWT_SECRET }
            );
            return true;
        } catch (error) {
            return false;
        }
    }

    async signIn(data: UserSignInDTO) {
        this.logger.log("User signin")

        let user = await this.userModel.findOne({ email: data.email }).select(["password", "token"]).exec();

        if (!user) throw new NotFoundException({ message: "Email not found" });

        if (!await bcrypt.compare(data.password, user.password)) throw new ConflictException({ message: "Invalid password" });

        // validate if jwt is still active
        if (!this.isJWTActive) {
            const payload = { sub: user.id, username: user.email };
            let jwt_secret = await this.jwtService.signAsync(payload, {
                secret: process.env.JWT_SECRET,
            })
            await this.userModel.findByIdAndUpdate(user.id, { token: jwt_secret })
        }

        let new_user = await this.userModel.findById(user.id).select(["password", "token"]).exec();

        if (data.admin_id) {
            if (new_user.role.toLowerCase() == "supportstaff") {
                if (data.admin_id != process.env.SUPPORT_STAFF_ADMIN_ID) throw new UnauthorizedException({ message: "You just entered the wrong Admin ID for a support staff" });
            } else {
                if (data.admin_id != process.env.ADMIN_ID) throw new UnauthorizedException({ message: "Incorrect Admin ID" });
            }
        }

        delete new_user["password"];

        let loginHistory = new this.loginHistoryModel({ user: new_user });
        await loginHistory.save();

        return {
            message: "Login successful",
            data: await this.userModel.findById(user.id),
            jwt_secret: new_user.token
        }

    }
    async requestOtp(data: RequestOTP): Promise<object> {
        let { email } = data;
        const user = await this.userModel.findOne({ email }).exec();

        if (!user) {
            this.logger.error(`User with email ${email} not found`);
            throw new NotFoundException({ message: "User not found" })
        }

        // Generate a 6-digit OTP
        const otp = randomBytes(3).toString('hex').toUpperCase(); // Generate a 6-character OTP
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // OTP expires in 10 minutes

        // Store the OTP and expiry time in the user document
        let created_otp = new this.userOTPModel({ email, otp });
        await created_otp.save();

        setTimeout(() => {
            created_otp.is_active = false;
            created_otp.save();
        }, 5 * 1000 * 60)

        this.logger.debug(`OTP ${otp} stored for user ${email}`);

        const expiryDate = new Date(Date.now() + 60 * 60 * 1000); // Add 1 hour to current UTC time
        let html = `<p class="title">Your OTP Code</p>
            <div class="otp-code">${otp}</div>
            <p class="info">This code will expire in <strong>10 minutes</strong>.<br />
            Expiration: <strong>${expiryDate.toUTCString()}</strong></p>
            </div>
            <div class="footer">
            If you didn't request a password reset, you can safely ignore this message.<br />
            &copy; ${new Date().getFullYear()} RoadOpp
            </div>`

        this.utilService.sendEmail(html, "Password Reset", email, null);

        return {
            message: `An email has been sent to ${email}`,
        }

    }
    async getUsers(userSearchQuery: any) { return await this.userModel.find(userSearchQuery, { _id: 1 }).exec(); }
    async emailUser(email: string, subject: string, body: string) {
        let data = this.utilService.sendEmail(body, subject, email, "box");
        this.logger.log(`Email sent to user ${email}`);
        return data;
    }
    async validateOTP(data: ValidateOTP) {

        let { email, otp } = data;
        const user = await this.userModel.findOne({ email }).exec();

        if (!user) {
            this.logger.error(`User with email ${email} not found`);
            throw new NotFoundException({ message: "User not found" })
        }

        let otpModel = await this.userOTPModel.findOne({ email, otp })

        if (!otpModel) {
            this.logger.error(`Invalid OTP supplied`);
            throw new NotFoundException({ message: "Invalid OTP supplied" })
        }

        if (!otpModel.is_active) {
            await this.requestOtp({ email })
            throw new NotAcceptableException({ message: "This OTP had already been used, a new OTP has been sent to: " + email })
        }

        let slug = await this.utilService.generateRandomSlug(16);

        otpModel.token = slug;
        await otpModel.save();

        return {
            message: `OTP verified successfully`,
            token: slug
        }

    }
    async changePassword(data: ChangePasswordDTO) {

        let { token } = data;

        let otpModel = await this.userOTPModel.findOne({ token });

        if (!otpModel) {
            this.logger.error(`Invalid OTP supplied`);
            throw new NotFoundException({ message: "Invalid OTP supplied" })
        }

        if (!otpModel.is_active) {
            throw new NotAcceptableException({ message: "Password change process expired, please try again" })
        }

        let { email } = otpModel;

        otpModel.is_active = false;
        await otpModel.save();

        let user = await this.userModel.findOne({ email });

        if (!user) throw new NotFoundException({ message: "This use no longer exists in our system" })

        const saltOrRounds = parseInt(process.env.BYCRYPT_SALT);
        const hash = await bcrypt.hash(data.password, saltOrRounds);

        user.password = hash;
        await user.save();

        return {
            message: "Password changed successful"
        }
    }
    async stackRecipient(delivery: Delivery): Promise<string> {

        const slug = this.utilService.generateRandomSlug(16);
        let recipientModel = new this.recipientModel({ delivery: delivery, slug });

        await recipientModel.save()

        let data = await this.recipientModel.findById(recipientModel.id);
        log({ data });

        await setTimeout(async () => {
            this.recipientModel.findByIdAndDelete(data.id);
        }, 1000 * 60 * 60 * 24 * 3) // 3 days

        return (!data) ? null : slug;
    }
    async getDeliveryFromRecipientSlug(slug: string) {

        log({ slug })

        let recipient = await this.recipientModel.findOne({ slug });

        if (!recipient) throw new NotFoundException({ message: "The delivery you are trying to access no longer exists" });

        let id = recipient.delivery.toString();

        return id;

    }

    async toogleDelivery(slug: string, action: ToogleDeliveryDTO, delivery: Delivery) {

        let recipient = await this.recipientModel.findOne({ slug });

        if (!recipient) throw new NotFoundException({ message: "The delivery you are trying to access no longer exists" });

        log({ delivery })

        let dispatcher = delivery.dispatcher, email = dispatcher.email, name = dispatcher.name;

        if (!action) {

            this.utilService.sendEmail(`Hello ${name}\n Your delivery order ${delivery.tracking_id} has been rejected by the recipient`, "Delivery Rejected !", email, "canceled");

            return false;

        }

        this.utilService.sendEmail(`Hello ${name}\n Your delivery order ${delivery.tracking_id} has been accepted by the recipient.\nOnce a courier picks it up you'd be able to track it.`, "Delivery Accepted", email, "location");

        return true;

    }

    async pickupDeliveryNotification(delivery: Delivery, sessionId: string) {

        let id = (<any>delivery).id;
        let recipient = await this.recipientModel.findOne({ delivery: id });

        if (!recipient) throw new NotFoundException({ message: "Couldn't find a recipient attached to this delivery" });

        // log({delivery})

        let dispatcher = delivery.dispatcher, email = dispatcher.email, name = dispatcher.name;

        // let tracking_link = `\nUse this link ${process.env.BASE_URL}/recipient/track/${sessionId} to track the delivery`;

        let recipient_html_mail = `<div class="container">
            <div class="content" style='text-align: left'>
            <p style="margin-top: -80px;  font-size:18px;">Your order has been picked up by the courier. You can track your order using the link below.</p>
            <a href="https://www.roadopp.com/recipient/${sessionId}" style="color: white" class="track-link" target="_blank">Track Order</a>
            <br><br>
            </div> 
            <div class="footer">
            &copy; ${new Date().getFullYear()} RoadOpp &mdash; All rights reserved.
            </div> 
        </div>`

        this.utilService.sendEmail(recipient_html_mail, "Order Update", email, "box");

        this.utilService.sendEmail(recipient_html_mail, "Order Update", delivery.recipient.email, "box");

    }
    async updateProfile(user: User, data: UpdateUserDto) {
        let updated_user = await this.userModel.findByIdAndUpdate((<any>user).id, data);
        return {
            message: "Profile update successfully",
            data: await this.userModel.findById((<any>user).id)
        }
    }
    async updateProfileSupportStaff(id: string, data: UpdateUserDto) {
        let updated_user = await this.userModel.findByIdAndUpdate(id, data);
        if (!updated_user) throw new ConflictException({ message: "Error updating the user profile" });
        return {
            message: "Profile update successfully",
            data: await this.getUser(id)
        }
    }
    async viewProfile(user: User) {
        return {
            data: await this.userModel.findById((<any>user).id),
            notification: await this.getAdminNotification(user)//this.notificationModel.findOne({ "user": new Types.ObjectId((<any>user).id.toString()) })
        }
    }
    async getUser(id: string) {
        let user = await this.userModel.findById(id).select(['name', 'email', 'profile_pics', 'department', 'role', 'phone_number', 'staff_number', 'admin_id', 'is_verified', 'is_approved', 'is_active', 'createdAt']).exec();
        if (!user) throw new NotFoundException({ message: "User not found" });
        let history = await this.loginHistoryModel.find({ user: id });
        return { user, history };
    }
    async toggleAccountStatus(id: string, data: UserAccountStatusUpdateDTO) {
        if (!await this.userModel.findByIdAndUpdate(id, data)) throw new ConflictException({ message: "Action not successful" });
        return {
            message: "Action successful",
            data: await this.getUser(id)
        }
    }
    async stackNotification(userId: string) {
        let user = await this.userModel.findById(userId);
        // mongoQuery.courier = new Types.ObjectId((<any>(<any>courier).id).toString())
        let idObj = new Types.ObjectId(userId);
        // log({ idObj })
        let existing_notification = await this.notificationModel.findOne({ "user": idObj });
        // log({ existing_notification })
        if (existing_notification) {
            this.logger.log("Exisitng notification")
            return existing_notification;
        }
        this.logger.log("Creating notification")
        let notification = new this.notificationModel({ user });
        let data = await notification.save();
        // log({data})
        return data
    }
    async changePasswordSettings(user: User, data: UpdatePasswordDTO) {

        log({ user })

        const saltOrRounds = parseInt(process.env.BYCRYPT_SALT);
        const hash = await bcrypt.hash(data.password, saltOrRounds);

        if (!await bcrypt.compare(data.old_password, user.password)) throw new ConflictException({ message: "Your old password is invalid" });

        await this.userModel.findByIdAndUpdate((<any>user).id, { password: hash });

        return {
            message: "Password change successfully"
        }
    }
    async updateNotificationSettings(user: User, data: NotificationDto) {

        let idObj = new Types.ObjectId((<any>user).id.toString());
        // log({ idObj })
        let existing_notification = await this.notificationModel.findOne({ "user": idObj });

        await this.notificationModel.findByIdAndUpdate(existing_notification.id, data);

        return {
            message: "Notification settings updated successfully",
            data: await this.notificationModel.findOne({ "user": idObj })
        }

    }
    async stackAdminNotification(userId: string) {
        let user = await this.userModel.findById(userId);
        // mongoQuery.courier = new Types.ObjectId((<any>(<any>courier).id).toString())
        let idObj = new Types.ObjectId(userId);
        // log({ idObj })
        let existing_notification = await this.adminNotificationModel.findOne({ "user": idObj });
        // log({ existing_notification })
        if (existing_notification) {
            this.logger.log("Exisitng notification")
            return existing_notification;
        }
        this.logger.log("Creating notification")
        let notification = new this.adminNotificationModel({ user });
        let data = await notification.save();
        // log({data})
        return data
    }
    async updateAdminNotificationSettings(user: User, data: AdminNotificationDto) {

        let idObj = new Types.ObjectId((<any>user).id.toString());
        // log({ idObj })
        let existing_notification = await this.adminNotificationModel.findOne({ "user": idObj });

        await this.adminNotificationModel.findByIdAndUpdate(existing_notification.id, data);

        return {
            message: "Notification settings updated successfully",
            data: await this.adminNotificationModel.findOne({ "user": idObj })
        }

    }
    async getAdminNotification(user: User) {
        let idObj = new Types.ObjectId((<any>user).id);
        let existing_notification = await this.adminNotificationModel.findOne({ "user": idObj });
        return existing_notification;
    }
    async toggleIsActiveMode(data: CourierOnDutyModeDTO, user: User) {
        let fetched_user = await this.userModel.findById((<any>user).id);
        if (!fetched_user) throw new NotFoundException({ message: "User not found, please login again" });
        fetched_user.is_active = data.is_active;
        await fetched_user.save();
        return {
            message: "Update successful",
            data: await this.userModel.findById((<any>user).id)
        }
    }

    async topCouriers() {
        const latestDeliveries = await this.userModel
            .find({ role: "Courier" }) // Use the determined field
            .select(["total_delivery"])
            .sort({ total_delivery: -1 })
            .limit(10)
            .exec();
        return latestDeliveries;
    }

    async allActiveUsers(role: string) {
        return await this.userModel.countDocuments({ role, is_active: true }).exec()
    }

    async getActiveUsers(clause) {
        return await this.userModel.find({ ...clause, is_active: true });
    }

    async uploadProfilePicture(user: User, file: Express.Multer.File) {
        let data = await this.microsoftAzureService.uploadFiles([file]);
        let { url } = data[0];
        await this.userModel.findByIdAndUpdate((<any>user).id, { profile_pics: url });
        return await this.userModel.findById((<any>user).id);
    }

    async getNotificationMessages(user: User) {
        return await this.utilService.getNotifications(user.email)
    }

    async notifyCourier(courier: User) {

        let user = await this.userModel.findById((<any>courier).id).select(["total_delivery"]).exec();

        if (!user) throw new NotFoundException({ message: "Couldn't find this courier, please try again" });

        user.total_delivery = user.total_delivery + 1;
        user.save();

        this.utilService.sendEmail(
            `Hello ${courier.name}\n\nYour pickup delivery has been approved by the recipient.`,
            "Delivery Accepted !",
            courier.email,
            "location");

    }

    async getAllUsers(query: any) {

        const {
            page = 1,
            limit = 10,
            sort = true,
            date_filter_type,
            from_date,
            to_date,
            status,
            active,
            role,
            query: searchQuery
        } = query;

        // log({ query })

        const skip = (page - 1) * limit;
        const sortOrder = sort ? (sort.toString() == 'true') ? 1 : -1 : -1; // 1 for ascending, -1 for descending

        const mongoQuery: any = {}; // Filter by cancellation status

        // Date filtering
        if (date_filter_type && from_date && to_date) {
            const dateField = date_filter_type === true ? 'createdAt' : 'delivery_date';
            mongoQuery[dateField] = {
                $gte: new Date(from_date),
                $lte: new Date(to_date),
            };
        }

        // Full-text search
        if (searchQuery) {
            mongoQuery.$or = [
                { 'name': { $regex: searchQuery, $options: 'i' } },
                { 'email': { $regex: searchQuery, $options: 'i' } },
                { 'department': { $regex: searchQuery, $options: 'i' } },
                { 'role': { $regex: searchQuery, $options: 'i' } },
                { 'phone_number': { $regex: searchQuery, $options: 'i' } },
                { 'staff_number': { $regex: searchQuery, $options: 'i' } },
                { 'admin_id': { $regex: searchQuery, $options: 'i' } },
            ];
        }

        if (status) {
            mongoQuery.is_approved = status;
        }

        if (role) {
            mongoQuery.role = role;
        }

        if (active) {
            mongoQuery.is_active = active;
        }

        log(mongoQuery)

        try {
            const users = await this.userModel
                .find(mongoQuery)
                .skip(skip)
                .limit(limit)
                .select(['name', 'email', 'department', 'role', 'phone_number', 'staff_number', 'admin_id', 'is_verified', 'is_approved', 'is_active', "createdAt", "updatedAt"])
                .sort({ ["createdAt"]: sortOrder }) // Sort by the selected date field
                .exec();

            const total = await this.userModel.countDocuments(mongoQuery);
            return {
                users,
                page,
                limit,
                total,
            };
        } catch (error) {
            console.error("Error fetching users:", error);
            throw new NotFoundException({ message: "Failed to retrieve users" }); // Or handle the error as needed
        }
    }

    async userStat() {

        const now = new Date();
        const sevenDaysAgoStart = startOfDay(subDays(now, 7)); // Start of 7 days ago
        const oneDayAgoStart = startOfDay(subDays(now, 1)); // Start of 1 day ago (to define current period)

        // Helper function to get counts for a specific role and date range
        const getRoleCounts = async (role: string | null, startDate: Date, endDate: Date) => {
            const matchQuery: any = {
                createdAt: {
                    $gte: startDate,
                    $lte: endDate,
                },
            };
            if (role) {
                matchQuery.role = role;
            }
            return this.userModel.countDocuments(matchQuery).exec();
        };

        // Define the current 7-day period (e.g., last 7 full days from now)
        const currentPeriodStart = startOfDay(subDays(now, 7)); // Start of the current 7-day window
        const currentPeriodEnd = now; // Up to the current moment

        // Define the previous 7-day period (the 7 days immediately before the currentPeriodStart)
        const previousPeriodEnd = startOfDay(subDays(currentPeriodStart, 1)); // End of the day before current period started
        const previousPeriodStart = startOfDay(subDays(previousPeriodEnd, 6)); // 7 days before previousPeriodEnd

        log(`Current Period: ${format(currentPeriodStart, 'yyyy-MM-dd')} to ${format(currentPeriodEnd, 'yyyy-MM-dd HH:mm:ss')}`);
        log(`Previous Period: ${format(previousPeriodStart, 'yyyy-MM-dd')} to ${format(previousPeriodEnd, 'yyyy-MM-dd HH:mm:ss')}`);


        // --- Fetch counts for the CURRENT 7-day period ---
        const [
            totalUsersCurrent,
            couriersCurrent,
            dispatchersCurrent,
        ] = await Promise.all([
            getRoleCounts(null, currentPeriodStart, currentPeriodEnd), // Total users in current period
            getRoleCounts('Courier', currentPeriodStart, currentPeriodEnd), // Couriers in current period
            getRoleCounts('Dispatcher', currentPeriodStart, currentPeriodEnd), // Dispatchers in current period
        ]);

        // --- Fetch counts for the PREVIOUS 7-day period ---
        const [
            totalUsersPrevious,
            couriersPrevious,
            dispatchersPrevious,
        ] = await Promise.all([
            getRoleCounts(null, previousPeriodStart, previousPeriodEnd), // Total users in previous period
            getRoleCounts('Courier', previousPeriodStart, previousPeriodEnd), // Couriers in previous period
            getRoleCounts('Dispatcher', previousPeriodStart, previousPeriodEnd), // Dispatchers in previous period
        ]);

        // Helper to calculate percentage change
        const calculatePercentageChange = (current: number, previous: number): number => {
            if (previous === 0) {
                return current > 0 ? 100 : 0; // If previous was 0 and current is > 0, it's 100% growth (or 0 if still 0)
            }
            return parseFloat(((current - previous) / previous * 100).toFixed(2)); // To 2 decimal places
        };

        return {
            current_counts: {
                total_users: await this.userModel.countDocuments(),
                couriers: await this.userModel.countDocuments({ role: "Courier" }),
                dispatchers: await this.userModel.countDocuments({ role: "Dispatcher" }),
            },
            percentage_change_last_week: {
                total_users: calculatePercentageChange(totalUsersCurrent, totalUsersPrevious),
                couriers: calculatePercentageChange(couriersCurrent, couriersPrevious),
                dispatchers: calculatePercentageChange(dispatchersCurrent, dispatchersPrevious),
            },
        };

    }

}
