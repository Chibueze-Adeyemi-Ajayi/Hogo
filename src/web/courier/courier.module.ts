import { Module } from '@nestjs/common';
import { CourierController } from './courier.controller';
import { CourierService } from './courier.service';
import { DeliveryModule } from '../delivery/delivery.module';
import { UserModule } from '../user/user.module';

@Module({
  controllers: [CourierController],
  providers: [CourierService],
  imports: [
    DeliveryModule,
    UserModule
  ]
})
export class CourierModule {}
