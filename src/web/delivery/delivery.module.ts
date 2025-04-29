import { Module } from '@nestjs/common';
import { DeliveryController } from './delivery.controller';
import { DeliveryService } from './delivery.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Delivery, DeliverySchema } from './delivery.schema/delivery.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      {name: Delivery.name, schema: DeliverySchema}
    ])
  ],
  controllers: [DeliveryController],
  providers: [DeliveryService],
  exports: [DeliveryService]
})
export class DeliveryModule {}
