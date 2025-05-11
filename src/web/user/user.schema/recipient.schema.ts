import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, now } from "mongoose";
import { Delivery } from "src/web/delivery/delivery.schema/delivery.schema";

export type RecipientDocument = Recipient & Document

@Schema({ timestamps: true })
export class Recipient {

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: Delivery.name })
    delivery: Delivery;

    @Prop()
    slug: string

}

export const RecipientSchema = SchemaFactory.createForClass(Recipient);