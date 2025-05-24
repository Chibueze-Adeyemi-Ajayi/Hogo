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
import { CourierService } from '../courier/courier.service';
import { CourierModule } from '../courier/courier.module';
import { MicrosoftAzureModule } from 'src/third-party/microsoft-azure/microsoft-azure.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: Delivery.name, schema: DeliverySchema},
      {name: Tracking.name, schema: TrackingSchema}
    ]),
    // JwtModule,
    // DispatcherModule,
    UserModule,
    UtilsModule,
    CourierModule,
    MicrosoftAzureModule
  ],
  controllers: [DeliveryController],
  providers: [DeliveryService, CourierService],
  exports: [DeliveryService]
})
export class DeliveryModule {}
