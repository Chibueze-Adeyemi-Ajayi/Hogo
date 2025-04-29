import { Body, Controller, Inject, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { DispatcherSignInDTO, DispatcherSignUpDTO } from '../dispatcher/dispatcher.dto/dispatcher.dto';
import { ApiTags } from '@nestjs/swagger';

@ApiTags("auth")
@Controller('auth')
export class AuthController {
    constructor (
        @Inject() private readonly authService: AuthService
    ) {}
    @Post("dispatcher/sign-in")
    async dispatcherSignIn (@Body() data: DispatcherSignInDTO) {
        return await this.authService.dispatcherSignIn(data);
    }
    @Post("dispatcher/sign-up")
    async dispatcherSignUp (@Body() data: DispatcherSignUpDTO) {
        return await this.authService.dispatcherSignUp(data);
    }
}
