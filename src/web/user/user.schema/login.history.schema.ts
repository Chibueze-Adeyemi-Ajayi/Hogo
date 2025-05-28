import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, now } from "mongoose";
import { User } from "./user.schema";

export type LoginHistoryDocument = LoginHistory & Document

@Schema({ timestamps: true })
export class LoginHistory {

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
    user: User

    @Prop({ default: true, select: true })
    success: boolean

}

export const LoginHistorySchema = SchemaFactory.createForClass(LoginHistory);