import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import mongoose, { Document, now } from "mongoose";
import { Dispatcher, DispatcherDocument } from "src/web/dispatcher/dispatcher.schema/dispatcher.schema";
export type CourierDocument = Courier & Document

@Schema({ timestamps: true })
export class Courier {

 
}

export const CourierSchema = SchemaFactory.createForClass(Courier);