import { Module } from '@nestjs/common';
import { TrackerService } from './tracker.service';
import { DeliveryModule } from 'src/web/delivery/delivery.module';

@Module({
  imports: [DeliveryModule],
  providers: [TrackerService]
})
export class TrackerModule {}
