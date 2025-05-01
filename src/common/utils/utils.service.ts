import { Injectable } from '@nestjs/common';

@Injectable()
export class UtilsService {

    async sendEmail (content: string, subject: string, recipient: string) {
        return true;
    }

}
