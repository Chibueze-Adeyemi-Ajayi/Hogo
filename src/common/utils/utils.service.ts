import { MailerService } from '@nestjs-modules/mailer';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Notification, NotificationDocument } from './schema/NotificationSchema';
import { Model } from 'mongoose';
// import * as Twilio from "twilio"
import { UserService } from 'src/web/user/user.service';

@Injectable()
export class UtilsService {

    private client;
    private logger = new Logger(MailerService.name);

    constructor(
        private readonly mailService: MailerService,
        // @Inject(forwardRef(() => UserService)) private readonly userService: UserService,
        @InjectModel(Notification.name) private readonly notificationModel: Model<NotificationDocument>
    ) {
        this.client = require('twilio')(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN);
        // Twilio(process.env.TWILIO_SID, process.env.TWILIO_AUTH_TOKEN); 
    }

    async sendEmail(message: string, subject: string, recipient: string, type: string, isHtml: boolean = false) {
        try {

            if (type) {
                let notification = new this.notificationModel({ message, type, email: recipient })
                await notification.save();
            }

            const body = {
                from: `Hogoe <${process.env.WEBMAIL_USERNAME}>`,
                to: recipient,
                subject
            }

            if (isHtml) body["html"] = message;
            else body["text"] = message

            return await this.mailService.sendMail(body);

        } catch (error: any) {
            return null;
        }
    }

    async sendSms(to: string, body: string) {
        try {
            const message = await this.client.messages.create({
                body: body,
                from: process.env.TWILIO_PHONE_NUMBER, // Your Twilio phone number
                to: to,
            });
            this.logger.debug('SMS sent:', message.sid);
            return message;
        } catch (error) {
            this.logger.debug('Error sending SMS:', error); 
        }
    }

    addToDate(date, days) {
        var result = date.setDate(date.getDate() + days);
        return new Date(result)
    }

    generateOTP(length: number = 4) {
        const digits = '0123456789';
        let otp = '';

        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * digits.length);
            const randomDigit = digits[randomIndex];
            otp += randomDigit;
        }

        return otp;
    }

    generateRandomSlug(length = 6) {
        const charSet = 'abcdefghijklmnopqrstuvwxyz-0123456789';
        let randomString = '';
        for (let i = 0; i < length; i++) {
            const randomIndex = Math.floor(Math.random() * charSet.length);
            randomString += charSet.charAt(randomIndex);
        }
        return randomString;
    }

    getBase64(val: string) {
        const buffer = Buffer.from(val, 'utf8');
        const base64String = buffer.toString('base64');
        return base64String;
    }

    async getNotifications(email) {
        return (await this.notificationModel.find({ email })).reverse()
    }

}
