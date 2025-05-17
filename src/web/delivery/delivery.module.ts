import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Delivery, DeliverySchema } from './delivery.schema/delivery.schema';
import { JwtModule } from '@nestjs/jwt';
import { DispatcherModule } from '../dispatcher/dispatcher.module';
import { UtilsModule } from 'src/common/utils/utils.module';
import { UserModule } from '../user/user.module';
import { Tracking, TrackingSchema } from './delivery.schema/tracking.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: Delivery.name, schema: DeliverySchema},
      {name: Tracking.name, schema: TrackingSchema}
    ]),
    // JwtModule,
    // DispatcherModule,
    UserModule,
    UtilsModule
  ],
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService]
})
export class DeliveryModule {}
