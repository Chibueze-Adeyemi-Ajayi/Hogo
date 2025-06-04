import { Module } from '@nestjs/common';
import { SupportAgentController } from './support-agent.controller';
import { SupportAgentService } from './support-agent.service';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { DeliveryModule } from '../delivery/delivery.module';
import { CourierModule } from '../courier/courier.module';
import { DispatcherModule } from '../dispatcher/dispatcher.module';
import { IssuesModule } from '../issues/issues.module';

@Module({
  controllers: [SupportAgentController],
  providers: [SupportAgentService],
  imports: [
    AuthModule, UserModule, DeliveryModule, CourierModule, DispatcherModule, IssuesModule
  ]
})
export class SupportAgentModule {}
