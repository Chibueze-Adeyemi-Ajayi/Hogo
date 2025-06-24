import { Inject, Injectable } from '@nestjs/common';
import { ContactDTO } from './contact.dto/contact.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Contact, ContactDocument } from './contact.schema/contact,schema';
import { Model } from 'mongoose';
import { UtilsService } from 'src/common/utils/utils.service';

@Injectable()
export class ContactService {

    constructor (
        @Inject() private readonly utilService: UtilsService,
        @InjectModel(Contact.name) private readonly contactModel: Model<ContactDocument>
    ) {}

    async contact(data: ContactDTO) {
        const html = this.generateContactHtml(data);
        const contact = new this.contactModel(data);
        this.utilService.sendEmail(html, "Contact", "support@roadopp.com", null, true);
        await contact.save();
        return { message: "Message sent successfully", data }
    }   

    private generateContactHtml(data: ContactDTO): string {
        return ` 
            <html>
                <head>
                    <style>
                        body { font-family: Arial, sans-serif; }
                        .section { margin-bottom: 16px; }
                        .label { font-weight: bold; }
                        .value { margin-left: 8px; }
                    </style>
                </head>
                <body>
                    <div class="section">
                        <span class="label">Full Name:</span>
                        <span class="value">${data.fullname}</span>
                    </div>
                    <div class="section">
                        <span class="label">Email:</span>
                        <span class="value">${data.email}</span>
                    </div>
                    ${data.phone ? `
                    <div class="section">
                        <span class="label">Phone:</span>
                        <span class="value">${data.phone}</span>
                    </div>` : ''}
                    ${data['zip-code'] ? `
                    <div class="section">
                        <span class="label">ZIP Code:</span>
                        <span class="value">${data['zip-code']}</span>
                    </div>` : ''}
                    ${data.description ? `
                    <div class="section">
                        <span class="label">Description:</span>
                        <span class="value">${data.description}</span>
                    </div>` : ''}
                    ${data.message ? `
                    <div class="section">
                        <span class="label">Message:</span>
                        <span class="value">${data.message}</span>
                    </div>`: ''}
                </body>
            </html>
        `;
    }
}
