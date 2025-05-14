import { CanActivate, ExecutionContext, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UserService } from 'src/web/user/user.service';

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
export class UserGuard implements CanActivate {
  constructor(private userService: UserService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {

    const request = context.switchToHttp().getRequest();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) throw new UnauthorizedException({ message: "Authorization token is absent from header" })

    const token = authorizationHeader.split(' ')[1];

    if (!token) throw new UnauthorizedException({ message: "Authorization token is absent from header" })

    if (token.length < 10) throw new UnauthorizedException({ message: "Authorization token is absent from header" })

    const auth = await this.userService.getUserByJWT(token);

    if (!auth) throw new NotFoundException({ message: "Please login" })

    await this.userService.stackNotification(auth.id);

    request.headers["user"] = auth;

    return true;
  }
}
