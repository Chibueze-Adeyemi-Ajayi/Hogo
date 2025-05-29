import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin..service';
import { DeliveryModule } from '../delivery/delivery.module';
import { UserModule } from '../user/user.module';

@Module({
  controllers: [AdminController],
  providers: [AdminService],
  imports: [
    DeliveryModule,
    UserModule
  ]
})
export class AdminSupportStaffModule {}
