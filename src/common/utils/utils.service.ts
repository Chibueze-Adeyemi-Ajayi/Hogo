import { MailerService } from '@nestjs-modules/mailer';
import { forwardRef, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Notification, NotificationDocument } from './schema/NotificationSchema';
import { Model } from 'mongoose';
// import * as Twilio from "twilio"
import { UserService } from 'src/web/user/user.service';
import { log } from 'console';

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

            /*if (true)*/ body["html"] = this.htmlWrapper(subject, message);
            // else body["text"] = message

            return await this.mailService.sendMail(body);

        } catch (error: any) {
            log({ error });
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

    htmlWrapper(title: string, body: string) {
        return `
            <!DOCTYPE html>
            <html lang="en">

            <head>
            <meta charset="UTF-8" />
            <title>Pickup Notification</title>
            <style>
                body {
                background-color: #f5f5f5;
                margin: 0;
                padding: 0;
                font-family: 'Segoe UI', Tahoma, sans-serif;
                color: #111;
                }

                .container {
                max-width: 600px;
                margin: 40px auto;
                background-color: #ffffff;
                border-radius: 16px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
                overflow: hidden;
                }

                .header {
                background-color: #002205;
                padding: 20px;
                text-align: center;
                color: #fff;
                }

                .content {
                padding: 0px 20px;
                text-align: center;
                }

                .content h2 {
                font-size: 20px;
                margin-bottom: 10px;
                }

                .order-id {
                font-weight: bold;
                color: #003300;
                }

                .pickup-link {
                display: inline-block;
                margin-top: 20px;
                background-color: #002205;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 500;
                }

                .footer {
                padding: 20px;
                font-size: 12px;
                text-align: center;
                color: #777;
                background-color: #f0f0f0;
                }

                .title {
                font-size: 22px;
                margin-bottom: 10px;
                font-weight: bold;
                }

                .otp-code {
                font-size: 32px;
                font-weight: bold;
                color: #002205;
                margin: 10px 0;
                letter-spacing: 8px;
                }

                .order-id {
                font-weight: bold;
                color: #003300;
                }

                .track-link {
                display: inline-block;
                margin-top: 20px;
                background-color: #002205;
                color: white;
                padding: 12px 20px;
                border-radius: 8px;
                text-decoration: none;
                font-weight: 500;
                }

                .info {
                font-size: 14px;
                color: #444;
                }
            </style>
            </head>

            <body>
            <div class="container">
                <div class="header">
                <h2>${title}</h2>
                </div>
                <div class="content">
                    ${body}
                </div>
            </div>
            </body>

            </html>`
    }

}
