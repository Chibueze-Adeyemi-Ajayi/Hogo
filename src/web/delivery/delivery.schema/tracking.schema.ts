import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, now } from "mongoose";
// import { Courier, CourierDocument } from "src/web/courier/courier.schema/courier.schema";
// import { Dispatcher, DispatcherDocument } from "src/web/dispatcher/dispatcher.schema/dispatcher.schema";
import { IRecipient, ISpecimen } from "../delivery.interface/delivery.interface";
import { User } from "src/web/user/user.schema/user.schema";
import { Delivery } from "./delivery.schema";

export type TrackingDocument = Tracking & Document

@Schema({ timestamps: true })
export class Tracking {

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Delivery.name })
    delivery: Delivery;

    @Prop({ type: String })
    sessionId: string;

    @Prop()
    courier_socket_id: string

    @Prop()
    dispatcher_socket_id: string

    @Prop()
    recipient_socket_id: string

}

export const TrackingSchema = SchemaFactory.createForClass(Tracking);