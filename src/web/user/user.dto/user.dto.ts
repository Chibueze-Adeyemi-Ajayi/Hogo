import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsEmail, IsOptional, Length } from "class-validator";

export class UserDto {

  @ApiProperty({
    description: "User's name",
    example: "John Doe",
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "User's email",
    example: "john@doe.com",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "User's department",
    example: "Radiology",
  })
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiProperty({
    description: "User's role",
    example: "Dispatcher",
  })
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({
    description: "User's staff number",
    example: "SN12345",
  })
  @IsString()
  @IsNotEmpty()
  staff_number: string;

  @ApiProperty({
    required: false,
    description: "Admin Id",
    example: "1234",
  })
  @IsString()
  @IsOptional()
  admin_id: string;

  @ApiProperty({
    description: "User's password (should not be exposed in responses, but is needed for creation)",
    example: "password",
  })
  @IsString()
  @IsNotEmpty()
  password: string;
}

export class UserSignInDTO {

  @ApiProperty({
    description: "User's password (should not be exposed in responses, but is needed for creation)",
    example: "password",
  })
  @IsString()
  @IsNotEmpty()
  password: string;

  @ApiProperty({
    description: "User's email",
    example: "john@doe.com",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

//   @ApiProperty({
//     description: "User's email",
//     example: "john@doe.com",
//   })
//   @IsEmail()
//   @IsNotEmpty()
//   role: string;

}

export class RequestOTP {

  @ApiProperty({
    description: "User's email",
    example: "john@doe.com",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

}


export class ValidateOTP {

  @ApiProperty({
    description: "User's email",
    example: "john@doe.com",
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "OTP sent",
    example: "123456",
  })
  @IsString()
  @Length(6, 6)
  @IsNotEmpty()
  otp: string;

}


export class ChangePasswordDTO {

  @ApiProperty({
    description: "Token gotten from validate OTP",
    example: "xxxxxxxxxxxxxxx",
  })
  @IsString()
  @Length(16, 16)
  @IsNotEmpty()
  token: string;

  @ApiProperty({
    description: "The new password",
    example: "new password",
  })
  @IsNotEmpty()
  password: string;

}