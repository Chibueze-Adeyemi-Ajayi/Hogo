import { CanActivate, ExecutionContext, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { log } from 'console';
import { DispatcherService } from 'src/web/dispatcher/dispatcher.service';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {

    canActivate(context: ExecutionContext) {
        return super.canActivate(context);
    }

    handleRequest(err, user, info) {
        if (err || !user) {
            throw err || new UnauthorizedException();
        }
        let { userId } = user;
        return user;
    }

}


@Injectable()
export class DispatcherGuard implements CanActivate {
  constructor(private dispatcherService: DispatcherService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    
    const request = context.switchToHttp().getRequest();
    const authorizationHeader = request.headers.authorization;
    const token = authorizationHeader.split(' ')[1];

    const auth = await this.dispatcherService.getDispatcherByJWT(token);

    if (!auth) throw new NotFoundException({ message: "Please login" })

    request.headers["user"] = auth;

    return true;
  }
}
