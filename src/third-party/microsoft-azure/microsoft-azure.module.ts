import { Module } from '@nestjs/common';
import { MicrosoftAzureService } from './microsoft-azure.service';

@Module({
  providers: [MicrosoftAzureService],
  exports: [MicrosoftAzureService]
})
export class MicrosoftAzureModule {}
