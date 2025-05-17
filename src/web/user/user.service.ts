import { ConflictException, Inject, Injectable, Logger, NotAcceptableException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChangePasswordDTO, RequestOTP, ToogleDeliveryDTO, UpdatePasswordDTO, UpdateUserDto, UserDto, UserSignInDTO, ValidateOTP } from './user.dto/user.dto';
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
import { NotificationDto } from './user.dto/user.notification.dto';
import { CourierOnDutyModeDTO } from '../courier/courier.dto/courier.dto';

@Injectable()
export class UserService {
    private logger = new Logger(UserService.name)
    constructor(
        @Inject() private readonly jwtService: JwtService,
        @Inject() private readonly utilService: UtilsService,
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        @InjectModel(UserOTP.name) private readonly userOTPModel: Model<UserOTPDocument>,
        @InjectModel(Recipient.name) private readonly recipientModel: Model<RecipientDocument>,
        @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>,
    ) { }

    async getUserByJWT(jwt: string) {
        return await this.userModel.findOne({ token: jwt });
    }

    async signUp(data: UserDto) {

        this.logger.log("User signin")

        if (data.admin_id) {
            if (data.admin_id != process.env.ADMIN_ID) throw new UnauthorizedException({ message: "Incorrect Admin ID" });
        }

        let existing_email = await this.userModel.findOne({ email: data.email });
        if (existing_email) throw new ConflictException({ message: "Email already exists" });

        let existing_staff_number = await this.userModel.findOne({ staff_number: data.staff_number });
        if (existing_staff_number) throw new ConflictException({ message: "Staff number already exists" });

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

        delete new_user["password"];

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

        this.utilService.sendEmail(`Your password reset OTP is ${otp}, it would expire in 10 minutes time: ${otpExpiry}`, "OTP Request", email);

        return {
            message: `An email has been sent to ${email}`,
        }

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

            this.utilService.sendEmail(`Hello ${name}\n Your delivery order ${delivery.tracking_id} has been rejected by the recipient`, "Delivery Rejected !", email);

            return false;

        }

        this.utilService.sendEmail(`Hello ${name}\n Your delivery order ${delivery.tracking_id} has been accepted by the recipient.\nOnce a courier picks it up you'd be able to track it.`, "Delivery Accepted", email);

        return true;

    }

    async pickupDeliveryNotification(delivery: Delivery, sessionId: string) {

        let id = (<any>delivery).id;
        let recipient = await this.recipientModel.findOne({ delivery: id });

        if (!recipient) throw new NotFoundException({ message: "Couldn't find a recipient attached to this delivery" });

        // log({delivery})

        let dispatcher = delivery.dispatcher, email = dispatcher.email, name = dispatcher.name;

        let tracking_link = `\nUse this link ${process.env.BASE_URL}/track/${sessionId} to track the delivery`

        this.utilService.sendEmail(`Hello ${name}\n Your delivery order ${delivery.tracking_id} has been picked up by the courier.${tracking_link}`, "Delivery Pick up !", email);

        this.utilService.sendEmail(`Hello \n Your delivery order ${delivery.tracking_id} has been picked up by the courier.${tracking_link}`, "Delivery Pick up", delivery.recipient.email);

    }
    async updateProfile(user: User, data: UpdateUserDto) {
        let updated_user = await this.userModel.findByIdAndUpdate((<any>user).id, data);
        return {
            message: "Profile update successfully",
            data: await this.userModel.findById((<any>user).id)
        }
    }
    async viewProfile(user: User) {
        return {
            data: await this.userModel.findById((<any>user).id),
            notification: await this.notificationModel.findOne({ "user": new Types.ObjectId((<any>user).id.toString()) })
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

        const saltOrRounds = parseInt(process.env.BYCRYPT_SALT);
        const hash = await bcrypt.hash(data.password, saltOrRounds);

        if (!await bcrypt.compare(data.old_password, user.password)) throw new ConflictException({ message: "Invalid password" });

        await this.userModel.findByIdAndUpdate((<any>user).id, { password: hash })

        return {
            message: "Password change successfully"
        }
    }
    async updateNotificationSettings (user: User, data: NotificationDto) {

        let idObj = new Types.ObjectId((<any>user).id.toString());
        // log({ idObj })
        let existing_notification = await this.notificationModel.findOne({ "user": idObj });

        await this.notificationModel.findByIdAndUpdate(existing_notification.id, data);

        return {
            message: "Notification settings updated successfully",
            data: await this.notificationModel.findOne({ "user": idObj })
        }

    }

    async toggleIsActiveMode (data: CourierOnDutyModeDTO, user: User) {
        let fetched_user = await this.userModel.findById((<any>user).id);
        if (!fetched_user) throw new NotFoundException({message: "User not found, please login again"});
        fetched_user.is_active = data.is_active;
        await fetched_user.save();
        return {
            message:"Update successful",
            data: await this.userModel.findById((<any>user).id)
        }
    }
}
