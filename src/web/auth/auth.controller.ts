import { Body, Controller, Inject, Patch, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DispatcherSignInDTO, DispatcherSignUpDTO } from '../dispatcher/dispatcher.dto/dispatcher.dto';
import { ApiTags } from '@nestjs/swagger';
import { ChangePasswordDTO, RequestOTP, UserDto, UserSignInDTO, ValidateOTP } from '../user/user.dto/user.dto';

@ApiTags("auth")
@Controller('auth')
export class AuthController {
    constructor(
        @Inject() private readonly authService: AuthService
    ) { }
    @Post("sign-in")
    async signIn(@Body() data: UserSignInDTO) {
        return await this.authService.signIn(data);
    }
    @Post("sign-up")
    async signUp(@Body() data: UserDto) {
        return await this.authService.signUp(data);
    }
    @Post("request-otp")
    async requestOtp(@Body() data: RequestOTP) {
        return await this.authService.requestOtp(data)
    }
    @Post("validate-otp")
    async validateOTP(@Body() data: ValidateOTP) {
        return await this.authService.validateOTP(data)
    }
    @Patch("change-password")
    async changePassword(@Body() data: ChangePasswordDTO) {
        return await this.authService.changePassword(data)
    }
}
