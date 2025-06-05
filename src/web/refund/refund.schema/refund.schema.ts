import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, now } from "mongoose";
import { Delivery } from "src/web/delivery/delivery.schema/delivery.schema";
import { User } from "src/web/user/user.schema/user.schema";
export type RefundDocument = Refund & Document

@Schema({ timestamps: true })
export class Refund {

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
    user: User;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Delivery.name })
    delivery: Delivery;

    @Prop({ required: true })
    tracking_id: string;

    @Prop({ required: true })
    reason: string;

    @Prop({ required: true })
    status: string

    @Prop({ required: true })
    amount: number;

    @Prop()
    note: string

}

export const RefundSchema = SchemaFactory.createForClass(Refund);