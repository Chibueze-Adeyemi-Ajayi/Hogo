import { Body, Controller, Inject, Post } from '@nestjs/common';
import { ContactDTO } from './contact.dto/contact.dto';
import { ContactService } from './contact.service';

@Controller('contact')
export class ContactController {
    constructor (
        @Inject() private readonly contactService: ContactService
    ) {}
    @Post('')
    async contact(@Body() data: ContactDTO) {
        return await this.contactService.contact(data);
    }
}
