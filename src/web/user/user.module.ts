import { forwardRef, Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { UserOTP, UserOTPSchema } from './user.schema/user.otp.schema';
import { UtilsModule } from 'src/common/utils/utils.module';
import { Recipient, RecipientSchema } from './user.schema/recipient.schema';
import { DeliveryModule } from '../delivery/delivery.module';
import { NotificationSchema, Notification } from './user.schema/user.notification.schema';
import { MicrosoftAzureModule } from 'src/third-party/microsoft-azure/microsoft-azure.module';
import { LoginHistory, LoginHistorySchema } from './user.schema/login.history.schema';
import { AdminNotification, AdminNotificationSchema } from './user.schema/user.admin.notification.schema';
import { IssuesModule } from '../issues/issues.module';
import { RefundModule } from '../refund/refund.module';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserOTP.name, schema: UserOTPSchema },
      { name: Recipient.name, schema: RecipientSchema },
      { name: Notification.name, schema: NotificationSchema },
      { name: LoginHistory.name, schema: LoginHistorySchema },
      { name: AdminNotification.name, schema: AdminNotificationSchema },
    ]),
    JwtModule,
    UtilsModule,
    MicrosoftAzureModule,
    // RefundModule,
    // forwardRef(() => RefundModule) 
    // forwardRef(() => IssuesModule), // Use forwardRef to avoid circular dependency issues
    // DeliveryModule
  ],
  exports: [UserService]
})
export class UserModule {}
