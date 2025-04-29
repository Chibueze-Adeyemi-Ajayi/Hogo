import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsEmail, IsOptional, IsString, Length, max, min } from "class-validator";

export class CreateDeliveryDTO {

    @ApiProperty({
        description: "Location where the specimen is to be picked from",
        example: "Mountain View, Silicon Valley, Silicon Valley, USA"
    }) @IsString() pickup_address: string

    @ApiProperty({
        description: "Location where the specimen is to be picked from",
        example: "EKO Atlantic City, Lagos State, Nigeria"
    }) @IsString() dropoff_address: string

    @ApiProperty({
        required: false,
        description: "Individual receiving the delivery phone number 1",
        example: "+2348100000000"
    }) @IsString() @IsOptional() recipient_phone_number_1: string

    @ApiProperty({
        required: false,
        description: "Individual receiving the delivery phone number 2",
        example: "+2342348100000001"
    }) @IsString() @IsOptional() recipient_phone_number_2: string

    @ApiProperty({
        required: false,
        description: "Individual receiving the delivery email",
        example: "individual@website.com"
    }) @IsEmail() @IsOptional() recipient_email: string

    @ApiProperty({
        required: false,
        description: "List of specimen to be added to the delivery",
        example: [
            {
                type: "blood",
                quantity: 1,
                description: "Red blood cell for a dying patient",
                code: "MED-TO1",
            }
        ]
    }) @IsArray() @IsOptional() specimen: Object[]

}

export class UpdateDeliveryDTO {

    @ApiProperty({
        required: false,
        description: "Location where the specimen is to be picked from",
        example: "Mountain View, Silicon Valley, Silicon Valley, USA"
    }) @IsString() @IsOptional() pickup_address: string

    @ApiProperty({
        required: false,
        description: "Location where the specimen is to be picked from",
        example: "EKO Atlantic City, Lagos State, Nigeria"
    }) @IsString() @IsOptional() dropoff_address: string

    @ApiProperty({
        required: false,
        description: "Individual receiving the delivery phone number 1",
        example: "+2348100000000"
    }) @IsString() @IsOptional() recipient_phone_number_1: string

    @ApiProperty({
        required: false,
        description: "Individual receiving the delivery phone number 2",
        example: "+2342348100000001"
    }) @IsString() @IsOptional() recipient_phone_number_2: string

    @ApiProperty({
        required: false,
        description: "Individual receiving the delivery email",
        example: "individual@website.com"
    }) @IsEmail() @IsOptional() recipient_email: string

    @ApiProperty({
        required: false,
        description: "Calculated distance of travel",
        example: "600km"
    }) @IsString() @IsOptional() distance: string

    @ApiProperty({
        required: false,
        description: "Expected date of arrival",
        example: new Date()
    }) @IsString() @IsOptional() delivery_date: string

    @ApiProperty({
        required: false,
        description: "List of specimen to be added to the delivery",
        example: [
            {
                type: "blood",
                quantity: 1,
                description: "Red blood cell for a dying patient",
                code: "MED-TO1",
            }
        ]
    }) @IsArray() @IsOptional() specimen: Object[]

}

export class CancelDeliveryDTO {

    @ApiProperty({
        description: "Reason for cancelling the delivery",
        example: "The courier didn't pick it up on time"
    }) @IsString() reason: string


}