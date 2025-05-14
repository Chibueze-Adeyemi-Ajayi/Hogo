import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, now } from "mongoose";
import { User } from "./user.schema";

export type NotificationDocument = Notification & Document

@Schema({ timestamps: true })
export class Notification {

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
    user: User;

    @Prop({ default: true })
    courier_assigned: boolean

    @Prop({ default: true })
    courier_arrived_for_pickup: boolean

    @Prop({ default: true })
    delivery_on_transit: boolean

    @Prop({ default: true })
    delivery_completed: boolean

    @Prop({ default: true })
    delivery_failed: boolean

    @Prop({ default: true })
    courier_message: boolean

    @Prop({ default: false })
    eta_update: boolean

    @Prop({ default: true })
    request_cancelled_by_admin: boolean

    @Prop({ default: true })
    auto_reminder: boolean

}

export const NotificationSchema = SchemaFactory.createForClass(Notification);