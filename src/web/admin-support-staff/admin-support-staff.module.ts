import { Module } from '@nestjs/common';
import { AdminSupportStaffController } from './admin-support-staff.controller';
import { AdminSupportStaffService } from './admin-support-staff.service';
import { DeliveryModule } from '../delivery/delivery.module';
import { UserModule } from '../user/user.module';

@Module({
  controllers: [AdminSupportStaffController],
  providers: [AdminSupportStaffService],
  imports: [
    DeliveryModule,
    UserModule
  ]
})
export class AdminSupportStaffModule {}
