import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsDate, IsEmail, IsEnum, IsNumber, IsOptional, IsPositive, IsString, Length, max, min } from "class-validator";
import { DateFilterType } from "../delivery.enum/delivery.enum";
import { ISpecimen } from "../delivery.interface/delivery.interface";

export class CreateDeliveryDTO {

    @ApiProperty({
        description: "Location where the specimen is to be picked from",
        example: "Mountain View, Silicon Valley, Silicon Valley, USA"
    }) @IsString() pickup_address: string

    @ApiProperty({
        description: "Department the specimen is to be picked from",
        example: "Radiology"
    }) @IsString() pickup_dept: string

    @ApiProperty({
        description: "Staff to pickup the item from",
        example: "Elon Musk"
    }) @IsString() pickup_staff_name: string

    @ApiProperty({
        description: "Location where the specimen is to be picked from",
        example: "EKO Atlantic City, Lagos State, Nigeria"
    }) @IsString() dropoff_address: string

    @ApiProperty({
        description: "Staff to drop the item to",
        example: "Bill Gates"
    }) @IsString() dropoff_staff_name: string

    @ApiProperty({
        description: "Department the specimen is to be dropped",
        example: "ICU"
    }) @IsString() dropoff_dept: string

    @ApiProperty({
        // required: false,
        description: "Individual receiving the delivery phone number 1",
        example: "+2348100000000"
    }) @IsString() recipient_phone_number_1: string

    @ApiProperty({
        required: false,
        description: "Individual receiving the delivery phone number 2",
        example: "+2342348100000001"
    }) @IsString() @IsOptional() recipient_phone_number_2: string

    @ApiProperty({
        // required: false,
        description: "Individual receiving the delivery email",
        example: "individual@website.com"
    }) @IsEmail() recipient_email: string

    @ApiProperty({
        // required: false,
        description: "Delivery note",
        example: "Lorem ipsum"
    }) @IsString() note: string

    @ApiProperty({
        // required: false,
        description: "Distance in Miles",
        example: "765"
    }) @IsString() distance: string

    @ApiProperty({
        // required: false,
        description: "The price of the delivery",
        example: "1000"
    }) @IsString() price: string

    @ApiProperty({
        // required: false,
        description: "List of specimen to be added to the delivery",
        example: [
            {
                type: "blood",
                quantity: 1,
                code: "MED-TO1",
            }
        ]
    }) @IsArray() specimen: ISpecimen[]

}

export class UpdateDeliveryDTO {

    @ApiProperty({
        required: false,
        description: "Location where the specimen is to be picked from",
        example: "Mountain View, Silicon Valley, Silicon Valley, USA"
    }) @IsString() @IsOptional() pickup_address: string

    @ApiProperty({
        required: false,
        description: "Department the specimen is to be picked from",
        example: "Radiology"
    }) @IsString() @IsOptional() pickup_dept: string

    @ApiProperty({
        required: false,
        description: "Staff to pickup the item from",
        example: "Elon Musk"
    }) @IsString() @IsOptional() pickup_staff_name: string

    @ApiProperty({
        required: false,
        description: "Location where the specimen is to be picked from",
        example: "EKO Atlantic City, Lagos State, Nigeria"
    }) @IsString() @IsOptional() dropoff_address: string

    @ApiProperty({
        required: false,
        description: "Staff to drop the item to",
        example: "Bill Gates"
    }) @IsString() @IsOptional() dropoff_staff_name: string

    @ApiProperty({
        required: false,
        description: "Department the specimen is to be dropped",
        example: "ICU"
    }) @IsString() @IsOptional() dropoff_dept: string

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
        description: "Calculated distance of travel in km",
        example: "600"
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
                code: "MED-TO1",
            }
        ]
    }) @IsArray() @IsOptional() specimen: Object[]


    @ApiProperty({
        // required: false,
        description: "Delivery note",
        example: "Lorem ipsum"
    }) @IsString() note: string


}

export class CancelDeliveryDTO {

    @ApiProperty({
        description: "Reason for cancelling the delivery",
        example: "The courier didn't pick it up on time"
    }) @IsString() reason: string
}

export class DeliveryQueryDTO {
    @IsString()
    @IsOptional()
    @ApiProperty({
        required: false,
        description: "The search parameter - tracking_id, addresses, courier, location, recipient (email & phone number) (optional)",
        example: "ORD0009"
    })
    query?: string;

    @IsString()
    @IsOptional()
    @ApiProperty({
        required: false,
        description: "The search parameter - tracking_id, addresses, courier, location, recipient (email & phone number) (optional)",
        example: "active"
    })
    status?: string;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    // @Type(() => Number)
    @ApiProperty({
        required: false,
        description: "The current page for the pagination (optional)",
        example: 1
    })
    page?: number;

    @IsNumber()
    @IsPositive()
    @IsOptional()
    // @Type(() => Number)
    @ApiProperty({
        required: false,
        description: "The number of results expected (optional)",
        example: 10
    })
    limit?: number;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        required: false,
        description: "Filter the result as active or canceled delivery {false => active delivery, true => cancelled delivery} (optional)",
        example: false
    })
    canceled?: boolean;

    @IsBoolean()
    @IsOptional()
    @ApiProperty({
        required: false,
        description: "Set the order of results {true => ascending, false => descending} (optional)",
        example: true
    })
    sort?: boolean;

    @IsString()
    @IsEnum(["creation-date", "delivery-date"])
    @IsOptional()
    @ApiProperty({
        required: false,
        description: "While using date filter set appropraitely to know the date to be considered when filtering within date range (optional)",
        example: DateFilterType.CREATION_DATE,
        enum: DateFilterType
    })
    date_filter_type?: string;

    @IsDate()
    @IsOptional()
    @ApiProperty({
        required: false,
        description: "The date to start the sort",
        example: "2025-04-29T19:25:16.546Z"
    })
    from_date?: Date;

    @IsDate()
    @IsOptional()
    @ApiProperty({
        required: false,
        description: "The date to start the sort",
        example: "2025-09-29T19:25:16.546Z"
    })
    to_date?: Date;
}

function Type(arg0: () => NumberConstructor): (target: DeliveryQueryDTO, propertyKey: "limit") => void {
    throw new Error("Function not implemented.");
}
