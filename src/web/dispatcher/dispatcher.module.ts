import { Module } from '@nestjs/common';
import { DispatcherController } from './dispatcher.controller';
import { DispatcherService } from './dispatcher.service';
// import { Dispatcher, DispatcherSchema } from './dispatcher.schema/dispatcher.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { DeliveryModule } from '../delivery/delivery.module';
import { UserModule } from '../user/user.module';
import { UtilsModule } from 'src/common/utils/utils.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      // { name: Dispatcher.name, schema: DispatcherSchema }
    ]),
    JwtModule, 
    DeliveryModule,
    UserModule,
    UtilsModule
  ],
  controllers: [DispatcherController],
  providers: [DispatcherService],
  exports: [DispatcherService]
})
export class DispatcherModule {}
