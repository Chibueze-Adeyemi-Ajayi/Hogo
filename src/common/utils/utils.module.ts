import { forwardRef, Module } from '@nestjs/common';
import { UtilsService } from './utils.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Notification, NotificationSchema } from './schema/NotificationSchema';
import { UserModule } from 'src/web/user/user.module';

@Module({
  providers: [UtilsService],
  exports: [UtilsService],
  imports: [
    // forwardRef(() => UserModule),
    MongooseModule.forFeature([
      {name: Notification.name, schema: NotificationSchema}
    ])
  ]
})
export class UtilsModule {}
