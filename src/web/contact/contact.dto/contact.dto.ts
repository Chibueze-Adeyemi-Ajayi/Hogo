import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsEmail, IsNotEmpty, IsOptional } from "class-validator";

export class ContactDTO {

    @ApiProperty({
        description: "fullname",
        example: "John Doe",
        required: true
    })
    @IsString()
    @IsNotEmpty()
    fullname: string;

    @ApiProperty({
        description: "email",
        example: "john@doe.com",
        required: true
    })
    @IsNotEmpty()
    @IsEmail()
    email: string;

    @ApiProperty({
        description: "description of the email",
        example: "dummy description here",
        required: true
    })
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    description: string;

    @ApiProperty({
        description: "phone number",
        example: "0812125643"
    })
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    phone: string;

    @ApiProperty({
        description: "ZIP code",
        example: "RSA3110CA"
    })
    @IsString() 
    @IsOptional()
    @IsNotEmpty()
    'zip-code': string;

    @ApiProperty({
        description: "message",
        example: "Dummy messages",
        required: true
    })
    @IsString()
    @IsOptional()
    @IsNotEmpty()
    message: string;

}