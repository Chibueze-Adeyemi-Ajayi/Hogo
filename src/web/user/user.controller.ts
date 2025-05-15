import { Body, Controller, Get, Inject, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard, UserGuard } from '../auth/auth.guards/auth.guard';
import { UserService } from './user.service';
import { AuthUser } from '../auth/auth.decorators/auth.decorator';
import { User } from './user.schema/user.schema';
import { UpdatePasswordDTO, UpdateUserDto } from './user.dto/user.dto';
import { NotificationDto } from './user.dto/user.notification.dto';

@Controller('user')
@ApiBearerAuth("JWT-auth")
@UseGuards(JwtAuthGuard)
@UseGuards(UserGuard)
export class UserController {
    constructor(
        @Inject() private readonly userService: UserService
    ) { }
    @Patch("update/profile")
    async updateProfile(@AuthUser() user: User, @Body() data: UpdateUserDto) {
        return await this.userService.updateProfile(user, data);
    }
    @Get("profile")
    async viewProfile(@AuthUser() user: User) {
        return await this.userService.viewProfile(user);
    }
    @Patch("settings/password")
    async changePasswordSettings(@AuthUser() user: User, @Body() data: UpdatePasswordDTO) {
        return await this.userService.changePasswordSettings(user, data)
    }
    @Patch("settings/notification")
    async updateNotificationSettings (@AuthUser() user: User, @Body() data: NotificationDto) {
        return await this.userService.updateNotificationSettings(user, data)
    }
}
