import { Body, Controller, Get, Inject, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, UserGuard } from '../auth/auth.guards/auth.guard';
import { UserService } from './user.service';
import { AuthUser } from '../auth/auth.decorators/auth.decorator';
import { User } from './user.schema/user.schema';
import { UpdateUserDto } from './user.dto/user.dto';

@Controller('user')
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@UseGuards(UserGuard)
export class UserController {
    constructor (
        @Inject() private readonly userService: UserService
    ) {}
    @Patch("update/profile")
    async updateProfile (@AuthUser() user: User, @Body() data: UpdateUserDto) {
        return await this.userService.updateProfile(user, data);
    }
    @Get("profile")
    async viewProfile (@AuthUser() user: User) {
        return await this.userService.viewProfile(user);
    }
}
