import { Module } from '@nestjs/common';
import { DispatcherController } from './dispatcher.controller';
import { DispatcherService } from './dispatcher.service';
import { Dispatcher, DispatcherSchema } from './dispatcher.schema/dispatcher.schema';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtModule } from '@nestjs/jwt';
import { DeliveryModule } from '../delivery/delivery.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Dispatcher.name, schema: DispatcherSchema }
    ]),
    JwtModule, 
    DeliveryModule
  ],
  controllers: [DispatcherController],
  providers: [DispatcherService],
  exports: [DispatcherService]
})
export class DispatcherModule {}
