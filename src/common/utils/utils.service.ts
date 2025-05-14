import { MailerService } from '@nestjs-modules/mailer';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class UtilsService {

    private logger = new Logger(MailerService.name);

    constructor(private readonly mailService: MailerService) { }

    async sendEmail(message: string, subject: string, recipient: string) {
        try {

            return await this.mailService.sendMail({
                from: `Hogoe <${process.env.WEBMAIL_USERNAME}>`,
                to: recipient,
                subject,
                text: message,
            });

        } catch (error: any) {
            return null;
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


}
