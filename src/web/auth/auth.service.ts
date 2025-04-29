import { Inject, Injectable } from '@nestjs/common';
import { DispatcherService } from '../dispatcher/dispatcher.service';
import { DispatcherSignInDTO, DispatcherSignUpDTO } from '../dispatcher/dispatcher.dto/dispatcher.dto';

@Injectable()
export class AuthService {
    constructor (
        @Inject() private readonly dispatcherService: DispatcherService
    ) {}
    async dispatcherSignIn (data: DispatcherSignInDTO) {
        return await this.dispatcherService.signIn(data);
    }
    async dispatcherSignUp (data: DispatcherSignUpDTO) {
        return await this.dispatcherService.signUp(data);
    }
}
