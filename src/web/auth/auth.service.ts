import { Inject, Injectable } from '@nestjs/common';
import { UserService } from '../user/user.service';
import { ChangePasswordDTO, RequestOTP, UserDto, UserSignInDTO, ValidateOTP } from '../user/user.dto/user.dto';

@Injectable()
export class AuthService {
    constructor (
        @Inject() private readonly userService: UserService,
    ) {}
    async signIn (data: UserSignInDTO) {
        // return await this.dispatcherService.signIn(data);
        return await this.userService.signIn(data)
    }
    async signUp (data: UserDto) {
        // return await this.dispatcherService.signUp(data);
        return await this.userService.signUp(data)
    }
    async requestOtp(data: RequestOTP) {
        return await this.userService.requestOtp(data)
    }
    async validateOTP (data: ValidateOTP) {
        return await this.userService.validateOTP(data)
    }
    async changePassword (data: ChangePasswordDTO) {
        return await this.userService.changePassword(data)
    }
}
