import { ApiProperty } from "@nestjs/swagger";
import { IsString, IsNotEmpty, IsEmail, IsOptional, Length, IsBoolean, IsNumber } from "class-validator";

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
    description: "User phone number",
    example: "2348131869009",
  })
  @IsString()
  @IsNotEmpty()
  phone_number: string;

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

export class UpdateUserDto {

  @ApiProperty({
    description: "User's name",
    example: "John Doe",
    required: false
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: "User's email",
    example: "john@doe.com",
    required: false
  })
  @IsOptional()
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: "User's department",
    example: "Radiology",
    required: false
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  department: string;

  @ApiProperty({
    description: "User phone number",
    example: "2348131869009",
    required: false
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  phone_number: string;

  @ApiProperty({
    description: "User's role",
    example: "Dispatcher",
    required: false
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  role: string;

  @ApiProperty({
    description: "User's staff number",
    example: "SN12345",
    required: false
  })
  @IsOptional()
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

  @ApiProperty({
    description: "Admin ID",
    required: false,
    example: "support staff: 5678 - other admins: 1234",
  })
  @IsString()
  @IsOptional()
  @IsNotEmpty()
  admin_id: string;

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

export class UpdatePasswordDTO {

  @ApiProperty({
    description: "Old password",
    example: "old password",
  })
  @IsString()
  @Length(8)
  @IsNotEmpty()
  old_password: string;

  @ApiProperty({
    description: "The new password",
    example: "new password",
  })
  @IsNotEmpty()
  password: string;

}

export class ToogleDeliveryDTO {

  @ApiProperty({
    description: "The action performed by the recipient (accept or reject)",
    example: true,
  })
  @IsBoolean()
  @IsNotEmpty()
  action: boolean;

}

export class UploadFileDto {
  @ApiProperty({ type: 'string', format: 'binary', description: 'The file to upload' })
  file: Express.Multer.File;
}

export class UserAccountStatusUpdateDTO {
  @ApiProperty({
    description: 'The status of the account either true or false',
    example: true,
  })
  @IsBoolean()
  is_approved: string
}

export class UserQueryDto {
  @ApiProperty({
    description: 'The full name of the user',
    example: 'John Doe',
    minLength: 3,
  })
  @IsString()
  @Length(3)
  name: string;

  @ApiProperty({
    description: 'The email address of the user',
    example: 'john.doe@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The department the user belongs to',
    example: 'Lab C1',
  })
  @IsString()
  department: string;

  @ApiProperty({
    description: 'The role of the user within the organization',
    example: 'Courier',
  })
  @IsString()
  role: string;

  @ApiProperty({
    description: 'The phone number of the user',
    example: '+1234567890',
    minLength: 8,
  })
  @IsString()
  phone_number: string;

  @ApiProperty({
    description: 'The staff number of the user',
    example: 'SN12345',
    minLength: 3,
  })
  @IsString()
  @Length(3)
  staff_number: string;

}