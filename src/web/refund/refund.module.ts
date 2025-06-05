import { Module } from '@nestjs/common';
import { RefundController } from './refund.controller';
import { RefundService } from './refund.service';
import { Refund, RefundSchema } from './refund.schema/refund.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { UserModule } from '../user/user.module';
import { DeliveryModule } from '../delivery/delivery.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Refund.name, schema: RefundSchema }
    ]),
    UserModule,
    DeliveryModule
  ],
  controllers: [RefundController],
  providers: [RefundService],
  exports: [RefundService]
})
export class RefundModule {}
