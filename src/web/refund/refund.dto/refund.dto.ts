import { ApiProperty } from "@nestjs/swagger";
import { IsNumber, IsOptional, IsPositive, IsString } from "class-validator";

export class OpenRefundDTO {

    @ApiProperty({
        description: "The reason for the refund - it's in camel case seperated by -",
        example: "Duplicate-Charge",
        required: false
    }) @IsString() reason: string;

    @ApiProperty({
        description: "The amount requested to be refunded",
        example: 300,
        required: false
    }) @IsNumber() @IsPositive() amount: number;


    @ApiProperty({
        description: "Note to report (optional)",
        example: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
        required: false
    }) @IsOptional() @IsString() note: string;

}


export class UpdateRefundDTO {
    @ApiProperty({
        description: "Type of issue - it's in lowercase separated by - values are",
        example: "pending",
        enum: ["pending", "declined", "approved"],
        required: false
    }) @IsOptional() @IsString() status: string;

}