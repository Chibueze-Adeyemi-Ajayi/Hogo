import { Module } from '@nestjs/common';
import { IssuesController } from './issues.controller';
import { IssuesService } from './issues.service';
import { MongooseModule } from '@nestjs/mongoose';
import { IssuesAndReport, IssuesAndReportSchema } from './issues.schema/issues.schema';
import { DeliveryModule } from '../delivery/delivery.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: IssuesAndReport.name, schema: IssuesAndReportSchema }
    ]),
    DeliveryModule, UserModule
  ],
  controllers: [IssuesController],
  providers: [IssuesService],
  exports: [IssuesService]
})
export class IssuesModule {}
