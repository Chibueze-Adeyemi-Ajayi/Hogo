import { ApiProperty } from "@nestjs/swagger";
import { IsArray, IsBoolean, IsEmail, IsOptional, IsString, Length, max, min } from "class-validator";
import { INSTITUTION_TYPE } from "../dispatcher.enum/dispatcher.enum";

export class DispatcherSignInDTO {

    @ApiProperty({
        required: false,
        description: "username (optional)",
        example: "jilo"
    }) @IsString() @IsOptional() username?: string;

    @ApiProperty({
        required: false,
        description: "email (optional)",
        example: "jilo@mail.com"
    }) @IsEmail() @IsOptional() email?: string;

    @ApiProperty({
        description: "password",
        example: "password"
    }) @IsString() @Length(8, 16) password: string;

}

export class DispatcherSignUpDTO {

    @ApiProperty({
        required: false,
        description: "first name (optional)",
        example: "jilo_name"
    }) @IsString() @IsOptional() first_name?: string;

    @ApiProperty({
        required: false,
        description: "last name (optional)",
        example: "developer"
    }) @IsString() @IsOptional() last_name?: string;

    @ApiProperty({
        required: false,
        description: "username (optional)",
        example: "jilo"
    }) @IsString() @IsOptional() username?: string;

    @ApiProperty({
        required: false,
        description: "email (optional)",
        example: "jilo@mail.com"
    }) @IsEmail() @IsOptional() email?: string;

    @ApiProperty({
        required: false,
        description: "institutional (optional)",
        example: "Medicare"     
    }) @IsString() @IsOptional() institution_name?: string;

    @ApiProperty({
        required: false,
        description: "type of institution (optional)",
        example: INSTITUTION_TYPE.HOSPITAL,
        enum: [INSTITUTION_TYPE.HOSPITAL, INSTITUTION_TYPE.LAB]
    }) @IsString() @IsOptional() institution_type?: string;

    @ApiProperty({
        description: "password",
        example: "password"
    }) @IsString() @Length(8, 16) password: string;

    @ApiProperty({
        description: "role (optional)",
        example: "dispatcher"
    }) @IsString() role: string;

}