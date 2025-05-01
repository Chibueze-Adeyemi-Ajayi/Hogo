import { ConflictException, forwardRef, Inject, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Dispatcher, DispatcherDocument } from './dispatcher.schema/dispatcher.schema';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { DispatcherSignInDTO, DispatcherSignUpDTO } from './dispatcher.dto/dispatcher.dto';
import { DeliveryService } from '../delivery/delivery.service';
import { CancelDeliveryDTO, CreateDeliveryDTO, DeliveryQueryDTO, UpdateDeliveryDTO } from '../delivery/delivery.dto/delivery.dto';

@Injectable()
export class DispatcherService {
    private logger = new Logger(DispatcherService.name)
    constructor(
        private readonly jwtService: JwtService,
        // @Inject(forwardRef(() => DeliveryService))
        private readonly deliveryService: DeliveryService,
        @InjectModel(Dispatcher.name) private readonly dispatcherModel: Model<DispatcherDocument>
    ) { }
    async signUp(data: DispatcherSignUpDTO) {

        this.logger.log("User signin")
        if (!data.email && !data.username) throw new ConflictException({ message: "Either email or username is required" })

        if (data.email) {
            let existing_email = await this.dispatcherModel.findOne({ email: data.email });
            if (existing_email) throw new ConflictException({ message: "Email already exists" })
        }

        if (data.username) {
            let existing_username = await this.dispatcherModel.findOne({ username: data.username })
            if (existing_username) throw new ConflictException({ message: "Username already exists" })
        }

        const saltOrRounds = parseInt(process.env.BYCRYPT_SALT);
        const hash = await bcrypt.hash(data.password, saltOrRounds);

        data.password = hash;

        let dispatcher = new this.dispatcherModel(data);
        await dispatcher.save();

        const payload = { sub: dispatcher.id, username: dispatcher.email };
        let jwt_secret = await this.jwtService.signAsync(payload, {
            secret: process.env.JWT_SECRET,
        })

        await this.dispatcherModel.findByIdAndUpdate(dispatcher.id, { token: jwt_secret })

        delete data["password"]

        return {
            message: "Account creation successful",
            data,
            jwt_secret
        }
    }

    async getDispatcherByJWT (jwt: string) {
        return await this.dispatcherModel.findOne({token: jwt});
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

    async signIn(data: DispatcherSignInDTO) {
        this.logger.log("User signin")

        let dispatcher = await this.dispatcherModel.findOne({
            $or: [
                { email: data.email },
                { username: data.username }
            ]
        });

        if (!dispatcher) throw new NotFoundException({ message: data.email ? "Email not found" : "Username not found" });
        if (!data.email && !data.username) throw new ConflictException({ message: "Either email or username is required" });

        if (!await bcrypt.compare(data.password, dispatcher.password)) throw new ConflictException({ message: "Invalid password" });

        // validate if jwt is still active
        if (!this.isJWTActive) {
            const payload = { sub: dispatcher.id, username: dispatcher.email };
            let jwt_secret = await this.jwtService.signAsync(payload, {
                secret: process.env.JWT_SECRET,
            })
            await this.dispatcherModel.findByIdAndUpdate(dispatcher.id, { token: jwt_secret })
        }

        let new_dispatcher = await this.dispatcherModel.findById(dispatcher.id);

        delete new_dispatcher["password"];

        return {
            message: "Login successful",
            data: new_dispatcher,
            jwt_secret: new_dispatcher.token
        }

    }
    async addDelivery(data: CreateDeliveryDTO, dispatcher: Dispatcher) {
        this.logger.log("Add delivery")
        return await this.deliveryService.addDelivery(data, dispatcher)
    }
    async updateDelivery(data: UpdateDeliveryDTO, tracking_id: string, dispatcher: Dispatcher) {
        this.logger.log("Update delivery")
        return await this.deliveryService.updateDelivery(data, tracking_id, dispatcher)
    }
    async cancelDelivery(data: CancelDeliveryDTO, tracking_id: string, dispatcher: Dispatcher) {
        this.logger.log("Cancel delivery")
        return await this.deliveryService.cancelDelivery(data, tracking_id, dispatcher)
    }
    async viewDelivery (tracking_id: string, dispatcher: Dispatcher) {
        return await this.deliveryService.viewDelivery(tracking_id, dispatcher);
    }
    async viewAllDelivery (query: DeliveryQueryDTO, dispatcher: Dispatcher) {
        return await this.deliveryService.viewAllDelivery(query, dispatcher);
    }
    async submitDelivery (tracking_id: string, dispatcher: Dispatcher) {
        return await this.deliveryService.submitDelivery(tracking_id, dispatcher);
    }
}
