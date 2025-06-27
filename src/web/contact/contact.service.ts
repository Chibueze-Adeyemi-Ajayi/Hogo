import { Inject, Injectable } from '@nestjs/common';
import { ContactDTO } from './contact.dto/contact.dto';
import { InjectModel } from '@nestjs/mongoose';
import { Contact, ContactDocument } from './contact.schema/contact,schema';
import { Model } from 'mongoose';
import { UtilsService } from 'src/common/utils/utils.service';

@Injectable()
export class ContactService {

    constructor(
        @Inject() private readonly utilService: UtilsService,
        @InjectModel(Contact.name) private readonly contactModel: Model<ContactDocument>
    ) { }

    async contact(data: ContactDTO) {
        const html = this.generateContactHtml(data);
        const contact = new this.contactModel(data);
        this.utilService.sendEmail(html, data.phone && data.message ? "New Driver Enquiry" : "Contact", "tobi@roadopp.com", null, true);
        this.utilService.sendEmail(html, data.phone && data.message ? "New Driver Enquiry" : "Contact", "support@roadopp.com", null, true);
        await contact.save();
        return { message: "Message sent successfully", data }
    }

    private generateContactHtml(data: ContactDTO): string {
        return data.phone && data.message ? `<div class="content">
      <div class="field-label">Full Name</div>
      <div class="field-value">${data.fullname}</div>

      <div class="field-label">Email Address</div>
      <div class="field-value">${data.email}</div>

      <div class="field-label">Phone Number</div>
      <div class="field-value">${data.phone}</div>

      <div class="field-label">ZIP Code</div>
      <div class="field-value">${data['zip-code']}</div>

      <div class="field-label">Additional Message</div>
      <div class="field-value">
        ${data.message}
      </div>
    </div> <br><br>
    <div class="footer">
      &copy; 2025 RoadOpp &mdash; All rights reserved.
    </div>` : `<div class="content">

      <div class="field-label">Name</div>
      <div class="field-value">${data.fullname}</div>

      <div class="field-label">Email</div>
      <div class="field-value">${data.email}</div>
 
      <div class="field-label">Description</div>
      <div class="field-value">
        ${data.description} 
      </div>
    </div> <br><br>
    <div class="footer">
      &copy; 2025 RoadOpp &mdash; All rights reserved.
    </div>` 
    }
}
