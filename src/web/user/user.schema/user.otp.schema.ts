import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, now } from "mongoose";
import { User } from "./user.schema";

export type UserOTPDocument = UserOTP & Document

@Schema({ timestamps: true })
export class UserOTP {

    @Prop()
    email: string;

    @Prop()
    otp: string

    @Prop({ default: true })
    is_active: boolean

    @Prop()
    token: string

}

export const UserOTPSchema = SchemaFactory.createForClass(UserOTP);