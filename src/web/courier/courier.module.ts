import { forwardRef, Module } from '@nestjs/common';
import { CourierController } from './courier.controller';
import { CourierService } from './courier.service';
import { DeliveryModule } from '../delivery/delivery.module';
import { UserModule } from '../user/user.module';

@Module({
  controllers: [CourierController],
  providers: [CourierService],
  imports: [
    forwardRef(() => DeliveryModule),
    UserModule
  ],
  exports: [CourierService]
})
export class CourierModule {}
