import { CanActivate, ConflictException, ExecutionContext, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { log } from 'console';
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

    const auth = await this.userService.getUserByJWTViaAuthGuard(token);

    // 

    if (!auth) throw new NotFoundException({ message: "Please login" });

    await this.userService.stackNotification(auth.id);

    request.headers["user"] = auth;

    return true;
  }
}

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private userService: UserService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {

    const request = context.switchToHttp().getRequest();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) throw new UnauthorizedException({ message: "Authorization token is absent from header" })

    const token = authorizationHeader.split(' ')[1];

    if (!token) throw new UnauthorizedException({ message: "Authorization token is absent from header" })

    if (token.length < 10) throw new UnauthorizedException({ message: "Authorization token is absent from header" })

    const auth = await this.userService.getUserByJWTViaAuthGuard(token);

    if (!auth) throw new NotFoundException({ message: "Please login" })
      // log({auth})

    if (auth.role.toLowerCase() != "admin") throw new UnauthorizedException({ message: "Only Admins can access this information" });

    if (auth.role.toLowerCase() == "admin") {
      if (auth.admin_id != process.env.ADMIN_ID) throw new UnauthorizedException({ message: "The ADMIN Staff ID is not allowed" });
    }

    await this.userService.stackNotification(auth.id);
    await this.userService.stackAdminNotification(auth.id);

    request.headers["user"] = auth;

    return true;
  }
}

@Injectable()
export class SupportAgentGuard implements CanActivate {
  constructor(private userService: UserService) { }

  async canActivate(context: ExecutionContext): Promise<boolean> {

    const request = context.switchToHttp().getRequest();
    const authorizationHeader = request.headers.authorization;

    if (!authorizationHeader) throw new UnauthorizedException({ message: "Authorization token is absent from header" })

    const token = authorizationHeader.split(' ')[1];

    if (!token) throw new UnauthorizedException({ message: "Authorization token is absent from header" })

    if (token.length < 10) throw new UnauthorizedException({ message: "Authorization token is absent from header" })

    const auth = await this.userService.getUserByJWTViaAuthGuard(token);

    if (!auth) throw new NotFoundException({ message: "Please login" })
      // log({auth})

    if (auth.role.toLowerCase() != "supportstaff") throw new UnauthorizedException({ message: "Only support agent can access this information" });

    if (auth.role.toLowerCase() == "supportstaff") {
      if (auth.admin_id != process.env.SUPPORT_STAFF_ADMIN_ID) throw new UnauthorizedException({ message: "The support agent ID is not allowed" });
    }

    await this.userService.stackNotification(auth.id);
    await this.userService.stackAdminNotification(auth.id);

    request.headers["user"] = auth;

    return true;
  }
}