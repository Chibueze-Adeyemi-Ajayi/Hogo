import { ApiProperty } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class OpenIssuesDTO {
    @ApiProperty({
        description: "Type of issue - it's in camel case seperated by -",
        example: "Delivery-Failed",
        required: false
    }) @IsOptional() @IsString() type: string;

    @ApiProperty({
        description: "Note to report (optional)",
        example: "Lorem Ipsum is simply dummy text of the printing and typesetting industry.",
        required: false
    }) @IsOptional() @IsString() note: string;

}


export class UpdateIssuesDTO {
    @ApiProperty({
        description: "Type of issue - it's in lowercase seperated by -",
        example: "in-review",
        required: false
    }) @IsOptional() @IsString() status: string;

}