import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, now } from "mongoose";

export type UserDocument = User & Document

@Schema({ timestamps: true })
export class User {

    @Prop()
    name: string

    @Prop()
    email: string

    @Prop()
    department: string

    @Prop()
    role: string

    @Prop()
    staff_number: string

    @Prop()
    token: string

    @Prop()
    admin_id: string

    @Prop({ default: false })
    is_verified: boolean

    @Prop({ default: false })
    is_approved: boolean

    @Prop()
    password: string

}

export const UserSchema = SchemaFactory.createForClass(User);