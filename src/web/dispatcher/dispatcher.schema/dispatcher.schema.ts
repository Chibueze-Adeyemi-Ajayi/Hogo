// import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
// import mongoose, { Document, now } from "mongoose";
// import { INSTITUTION_TYPE } from "../dispatcher.enum/dispatcher.enum";

// export type DispatcherDocument = Dispatcher & Document

// @Schema({ timestamps: true })
// export class Dispatcher {

//     @Prop()
//     first_name: string

//     @Prop()
//     last_name: string

//     @Prop()
//     email: string

//     @Prop()
//     username: string

//     @Prop()
//     password: string

//     @Prop()
//     role: string

//     @Prop()
//     token: string

//     @Prop()
//     institution_name: string 

//     @Prop({ default: INSTITUTION_TYPE.HOSPITAL, enum: [INSTITUTION_TYPE.HOSPITAL, INSTITUTION_TYPE.LAB] })
//     institution_type: string

// }

// export const DispatcherSchema = SchemaFactory.createForClass(Dispatcher);