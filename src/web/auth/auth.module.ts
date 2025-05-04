import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { DispatcherModule } from '../dispatcher/dispatcher.module';
import { JwtService } from '@nestjs/jwt';
import { JwtStrategy } from './auth.strategy/auth.strategy';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    DispatcherModule, UserModule
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, JwtService]
})
export class AuthModule {}
