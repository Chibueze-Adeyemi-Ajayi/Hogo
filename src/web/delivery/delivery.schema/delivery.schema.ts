import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, now } from "mongoose";
// import { Courier, CourierDocument } from "src/web/courier/courier.schema/courier.schema";
// import { Dispatcher, DispatcherDocument } from "src/web/dispatcher/dispatcher.schema/dispatcher.schema";
import { IRecipient, ISpecimen } from "../delivery.interface/delivery.interface";
import { User } from "src/web/user/user.schema/user.schema";
export type DeliveryDocument = Delivery & Document

@Schema({ timestamps: true })
export class Delivery {

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
    dispatcher: User;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
    courier: User;

    @Prop()
    tracking_id: string

    @Prop()
    pickup_address: string

    @Prop()
    pickup_dept: string

    @Prop()
    pickup_staff_name: string

    @Prop()
    dropoff_address: string

    @Prop()
    dropoff_dept: string

    @Prop()
    dropoff_staff_name: string

    @Prop({type: Object})
    recipient: IRecipient

    @Prop()
    specimen: ISpecimen[]

    @Prop({default: false})
    active: boolean

    @Prop({default: false})
    isCancelled: boolean

    @Prop({default: "pending"})
    status: string

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

    @Prop()
    note: string

    @Prop()
    price: string
}

export const DeliverySchema = SchemaFactory.createForClass(Delivery);