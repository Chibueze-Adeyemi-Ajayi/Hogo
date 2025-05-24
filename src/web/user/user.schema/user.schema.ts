import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, now } from "mongoose";

export type UserDocument = User & Document

@Schema({ timestamps: true })
export class User {

    @Prop({ select: true })
    name: string

    @Prop({ select: true })
    email: string

    @Prop({ select: true })
    department: string

    @Prop({ select: true })
    role: string

    @Prop({ default: null, select: true })
    profile_pics: string

    @Prop({ select: true })
    phone_number: string

    @Prop({ select: true })
    staff_number: string

    @Prop({ select: false })
    token: string

    @Prop({ select: false })
    admin_id: string

    @Prop({ default: false })
    is_verified: boolean

    @Prop({ default: false })
    is_approved: boolean

    @Prop({ default: false, select: true })
    is_active: boolean

    @Prop({ select: false })
    password: string

}

export const UserSchema = SchemaFactory.createForClass(User);