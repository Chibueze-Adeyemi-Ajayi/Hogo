import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MailerModule } from '@nestjs-modules/mailer';
import { UtilsModule } from './common/utils/utils.module';
import { AuthModule } from './web/auth/auth.module';
import { DispatcherModule } from './web/dispatcher/dispatcher.module';
import { DeliveryModule } from './web/delivery/delivery.module';
import { CourierModule } from './web/courier/courier.module';
import { UserModule } from './web/user/user.module';
import { TrackerModule } from './gateway/tracker/tracker.module';
import { MicrosoftAzureModule } from './third-party/microsoft-azure/microsoft-azure.module';
import { AdminSupportStaffModule } from './web/admin/admin.module';
import { SupportAgentModule } from './web/support-agent/support-agent.module';
import { IssuesModule } from './web/issues/issues.module';
import { RefundModule } from './web/refund/refund.module';
import { ContactModule } from './web/contact/contact.module';

@Module({
  imports: [

    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env"
    }),

    MongooseModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        dbName: configService.get<string>('DB_NAME')
      }),
      inject: [ConfigService],
    }),

    MailerModule.forRoot({
      transport: {
        tls: { rejectUnauthorized: false },
        host: process.env.WEBMAIL_HOST,
        port: parseInt(process.env.WEBMAIL_PORT || "465"),
        secure: false,
        auth: {
          user: process.env.WEBMAIL_USERNAME,
          pass: process.env.WEBMAIL_PASSWORD
        },
      },
    }),

    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 10,
    }]),

    ScheduleModule.forRoot(),

    UtilsModule,

    AuthModule,

    DispatcherModule,

    DeliveryModule,

    CourierModule,

    UserModule,

    TrackerModule,

    MicrosoftAzureModule,

    AdminSupportStaffModule,

    SupportAgentModule,

    IssuesModule,

    RefundModule,

    ContactModule,

  ],
  controllers: [AppController],
  providers: [AppService], 
})
export class AppModule {}
