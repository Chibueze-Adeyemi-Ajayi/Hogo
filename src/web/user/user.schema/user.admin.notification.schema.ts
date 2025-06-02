import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, now } from "mongoose";
import { User } from "./user.schema";

export type AdminNotificationDocument = AdminNotification & Document

@Schema({ timestamps: true })
export class AdminNotification {

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
    user: User;

    @Prop({ default: true })
    new_delivery_request_created: boolean

    @Prop({ default: true })
    delivery_mark_as_completed: boolean

    @Prop({ default: true })
    delivery_marked_as_failed: boolean

    @Prop({ default: true })
    new_user_created: boolean

    @Prop({ default: true })
    system_log: boolean

}

export const AdminNotificationSchema = SchemaFactory.createForClass(AdminNotification);