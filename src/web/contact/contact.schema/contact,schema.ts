import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document } from "mongoose";
import { Delivery } from "src/web/delivery/delivery.schema/delivery.schema";

export type ContactDocument = Contact & Document;

@Schema({ timestamps: true })
export class Contact { 

    @Prop({ required: true })
    fullname: string;

    @Prop({ required: true })
    email: string;

    @Prop()
    description?: string;

    @Prop()
    phone?: string;

    @Prop({ name: 'zip-code' })
    zipCode?: string;

    @Prop()
    message?: string;

}

export const ContactSchema = SchemaFactory.createForClass(Contact);