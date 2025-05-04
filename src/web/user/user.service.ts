import { ConflictException, Inject, Injectable, Logger, NotAcceptableException, NotFoundException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ChangePasswordDTO, RequestOTP, UserDto, UserSignInDTO, ValidateOTP } from './user.dto/user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './user.schema/user.schema';
import { Model } from 'mongoose';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { UserOTP, UserOTPDocument } from './user.schema/user.otp.schema';
import { UtilsService } from 'src/common/utils/utils.service';

@Injectable()
export class UserService {
    private logger = new Logger(UserService.name)
    constructor(
        @Inject() private readonly jwtService: JwtService,
        @Inject() private readonly utilService: UtilsService,
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
        @InjectModel(UserOTP.name) private readonly userOTPModel: Model<UserOTPDocument>,
    ) { }

    async getUserByJWT(jwt: string) {
        return await this.userModel.findOne({ token: jwt });
    }

    async signUp(data: UserDto) {

        this.logger.log("User signin")

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

        let user = await this.userModel.findOne({ email: data.email });

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

        let new_user = await this.userModel.findById(user.id);

        delete new_user["password"];

        return {
            message: "Login successful",
            data: new_user,
            jwt_secret: new_user.token
        }

    }
    async requestOtp(data: RequestOTP): Promise<object> {
        let { email } = data;
        const user = await this.userModel.findOne({ email }).exec();

        if (!user) {
            this.logger.error(`User with email ${email} not found`);
            throw new NotFoundException({message: "User not found"})
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
    async validateOTP (data: ValidateOTP) {

        let { email, otp } = data;
        const user = await this.userModel.findOne({ email }).exec();

        if (!user) {
            this.logger.error(`User with email ${email} not found`);
            throw new NotFoundException({message: "User not found"})
        }

        let otpModel = await this.userOTPModel.findOne({ email, otp })

        if (!otpModel) {
            this.logger.error(`Invalid OTP supplied`);
            throw new NotFoundException({message: "Invalid OTP supplied"})
        }

        if (!otpModel.is_active) {
            await this.requestOtp({ email })
            throw new NotAcceptableException({message: "This OTP had already been used, a new OTP has been sent to: " + email})
        }

        let slug = await this.utilService.generateRandomSlug(16);

        otpModel.token = slug;
        await otpModel.save();

        return {
            message: `OTP verified successfully`,
            token: slug
        }

    }
    async changePassword (data: ChangePasswordDTO) {

        let { token } = data;

        let otpModel = await this.userOTPModel.findOne({ token });

        if (!otpModel) {
            this.logger.error(`Invalid OTP supplied`);
            throw new NotFoundException({message: "Invalid OTP supplied"})
        }

        if (!otpModel.is_active) {
            throw new NotAcceptableException({message: "Password change process expired, please try again"})
        }

        let { email } = otpModel;

        otpModel.is_active = false;
        await otpModel.save();

        let user = await this.userModel.findOne({email});

        if (!user) throw new NotFoundException({message: "This use no longer exists in our system"})

        const saltOrRounds = parseInt(process.env.BYCRYPT_SALT);
        const hash = await bcrypt.hash(data.password, saltOrRounds);

        user.password = hash;
        await user.save();

        return {
            message: "Password changed successful"
        }

    }
}
