import { Body, Controller, FileTypeValidator, Get, Inject, MaxFileSizeValidator, ParseFilePipe, Patch, Post, UploadedFile, UploadedFiles, UseGuards, UseInterceptors } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard, UserGuard } from '../auth/auth.guards/auth.guard';
import { UserService } from './user.service';
import { AuthUser } from '../auth/auth.decorators/auth.decorator';
import { User } from './user.schema/user.schema';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdatePasswordDTO, UpdateUserDto, UploadFileDto } from './user.dto/user.dto';
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
    async updateNotificationSettings(@AuthUser() user: User, @Body() data: NotificationDto) {
        return await this.userService.updateNotificationSettings(user, data)
    }
    @Post("profile-pics/upload")
    @UseInterceptors(FileInterceptor('file'))
    @ApiConsumes('multipart/form-data') // Indicates that the endpoint consumes multipart/form-data
    @ApiBody({
        required: true,
        description: 'The profile picture file (max 5MB, image types only)',
        type: UploadFileDto
    })
    async uploadProfilePics(@AuthUser() user: User, @UploadedFile(new ParseFilePipe({
        validators: [
            new MaxFileSizeValidator({ maxSize: 1024 * 1024 * 5 }),
            new FileTypeValidator({ fileType: 'image/*' }),
        ]
    })) file: Express.Multer.File) {
        return await this.userService.uploadProfilePicture(user, file);
    }
    @Get("messages/notification")
    async getNotificationMessages (@AuthUser() user: User) {
        return await this.userService.getNotificationMessages(user);
    }
}

