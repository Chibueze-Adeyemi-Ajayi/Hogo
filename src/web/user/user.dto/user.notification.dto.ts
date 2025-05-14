import { IsBoolean, IsMongoId, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class NotificationDto {

    @ApiProperty({ description: 'Indicates if a courier has been assigned', default: true, required: false, type: 'boolean' })
    @IsBoolean()
    @IsOptional()
    courier_assigned?: boolean;

    @ApiProperty({ description: 'Indicates if the courier has arrived for pickup', default: true, required: false, type: 'boolean' })
    @IsBoolean()
    @IsOptional()
    courier_arrived_for_pickup?: boolean;

    @ApiProperty({ description: 'Indicates if the delivery is on transit', default: true, required: false, type: 'boolean' })
    @IsBoolean()
    @IsOptional()
    delivery_on_transit?: boolean;

    @ApiProperty({ description: 'Indicates if the delivery is completed', default: true, required: false, type: 'boolean' })
    @IsBoolean()
    @IsOptional()
    delivery_completed?: boolean;

    @ApiProperty({ description: 'Indicates if the delivery failed', default: true, required: false, type: 'boolean' })
    @IsBoolean()
    @IsOptional()
    delivery_failed?: boolean;

    @ApiProperty({ description: 'Indicates if there is a courier message', default: true, required: false, type: 'boolean' })
    @IsBoolean()
    @IsOptional()
    courier_message?: boolean;

    @ApiProperty({ description: 'Indicates if the ETA has been updated', default: false, required: false, type: 'boolean' })
    @IsBoolean()
    @IsOptional()
    eta_update?: boolean;

    @ApiProperty({ description: 'Indicates if the request was cancelled by admin', default: true, required: false, type: 'boolean' })
    @IsBoolean()
    @IsOptional()
    request_cancelled_by_admin?: boolean;

    @ApiProperty({ description: 'Indicates if it is an auto reminder', default: true, required: false, type: 'boolean' })
    @IsBoolean()
    @IsOptional()
    auto_reminder?: boolean;
}
