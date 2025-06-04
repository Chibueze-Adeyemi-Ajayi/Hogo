import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, now } from "mongoose";
import { Delivery } from "src/web/delivery/delivery.schema/delivery.schema";
import { User } from "src/web/user/user.schema/user.schema";
export type IssuesAndReportDocument = IssuesAndReport & Document

@Schema({ timestamps: true })
export class IssuesAndReport {

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
    user: User;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Delivery.name })
    delivery: Delivery;

    @Prop({ required: true })
    tracking_id: string;

    @Prop({ required: true })
    type: string;

    @Prop({ required: true })
    status: string

    @Prop()
    note: string

}

export const IssuesAndReportSchema = SchemaFactory.createForClass(IssuesAndReport);