import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, now } from "mongoose";
import { User } from "src/web/user/user.schema/user.schema";

export type NotificationDocument = Notification & Document

@Schema({ timestamps: true })
export class Notification {

    @Prop()
    email: string;

    @Prop()
    message: string;
    
    @Prop({ enum: ["normal", "location", "box", "transit", "successful", "canceled"] })
    type: string

}

export const NotificationSchema = SchemaFactory.createForClass(Notification);