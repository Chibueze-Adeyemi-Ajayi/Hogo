import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, now } from "mongoose";
import { Courier, CourierDocument } from "src/web/courier/courier.schema/courier.schema";
import { Dispatcher, DispatcherDocument } from "src/web/dispatcher/dispatcher.schema/dispatcher.schema";
import { IRecipient, ISpecimen } from "../delivery.interface/delivery.interface";
export type DeliveryDocument = Delivery & Document

@Schema({ timestamps: true })
export class Delivery {

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Dispatcher.name })
    dispatcher: DispatcherDocument;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Courier.name })
    courier: CourierDocument;

    @Prop()
    tracking_id: string

    @Prop()
    pickup_address: string

    @Prop()
    dropoff_address: string

    @Prop({type: Object})
    recipient: IRecipient

    @Prop()
    specimen: ISpecimen[]

    @Prop({default: false})
    active: boolean

    @Prop({default: false})
    isCancelled: boolean

    @Prop()
    reason: string

    @Prop()
    lat: string

    @Prop()
    long: string

    @Prop()
    location: string

    @Prop()
    distance: string

    @Prop()
    delivery_date: Date
}

export const DeliverySchema = SchemaFactory.createForClass(Delivery);