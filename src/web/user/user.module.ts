import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from './user.schema/user.schema';
import { JwtModule } from '@nestjs/jwt';
import { UserOTP, UserOTPSchema } from './user.schema/user.otp.schema';
import { UtilsModule } from 'src/common/utils/utils.module';

@Module({
  controllers: [UserController],
  providers: [UserService],
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: UserOTP.name, schema: UserOTPSchema }
    ]),
    JwtModule,
    UtilsModule
  ],
  exports: [UserService]
})
export class UserModule {}
