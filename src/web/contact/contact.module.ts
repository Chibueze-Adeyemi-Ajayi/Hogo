import { Module } from '@nestjs/common';
import { ContactService } from './contact.service';
import { ContactController } from './contact.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Contact, ContactSchema } from './contact.schema/contact,schema';
import { UtilsModule } from 'src/common/utils/utils.module';

@Module({
  providers: [ContactService],
  controllers: [ContactController],
  imports: [
    UtilsModule,
    MongooseModule.forFeature([
      { name: Contact.name, schema: ContactSchema }
    ])
  ]
})
export class ContactModule {}
