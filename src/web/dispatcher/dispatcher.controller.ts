import { Body, Controller, Inject, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { DispatcherService } from './dispatcher.service';
import { CancelDeliveryDTO, CreateDeliveryDTO, UpdateDeliveryDTO } from '../delivery/delivery.dto/delivery.dto';
import { ApiBearerAuth, ApiParam } from '@nestjs/swagger';
import { DispatcherGuard, JwtAuthGuard } from '../auth/auth.guards/auth.guard';
import { Dispatcher } from './dispatcher.schema/dispatcher.schema';
import { AuthUser } from '../auth/auth.decorators/auth.decorator';
import { log } from 'console';

@Controller('dispatcher')
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@UseGuards(DispatcherGuard)
export class DispatcherController {

    constructor (
        @Inject() private readonly dispatcherController: DispatcherService
    ) {}

    @Post()
    async addDelivery(@Body() data: CreateDeliveryDTO, @AuthUser() dispatcher: any) {
        return await this.dispatcherController.addDelivery(data, dispatcher)
    }

    @Patch('update/:tracking_id')
    @ApiParam({ name: 'tracking_id', type: 'string', description: 'ID of the delivery', required: true })
    async updateDelivery(@Body() data: UpdateDeliveryDTO, @Param("tracking_id") tracking_id, @AuthUser() dispatcher: any) {
        return await this.dispatcherController.updateDelivery(data, tracking_id, dispatcher)
    }

    @Patch("cancel/:tracking_id")
    @ApiParam({ name: 'tracking_id', type: 'string', description: 'ID of the delivery', required: true })
    async cancelDelivery(@Body() data: CancelDeliveryDTO, @Param("tracking_id") tracking_id, @AuthUser() dispatcher: any) {
        return await this.dispatcherController.cancelDelivery(data, tracking_id, dispatcher)
    }
    
}