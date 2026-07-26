import { Schema, Types } from "mongoose";
import "./Tag.js";
export declare const content: import("mongoose").Model<{
    type: string;
    link: string;
    userId: Types.ObjectId;
    title: string;
    tags: Types.ObjectId[];
}, {}, {}, {
    id: string;
}, import("mongoose").Document<unknown, {}, {
    type: string;
    link: string;
    userId: Types.ObjectId;
    title: string;
    tags: Types.ObjectId[];
}, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<{
    type: string;
    link: string;
    userId: Types.ObjectId;
    title: string;
    tags: Types.ObjectId[];
} & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, Schema<any, import("mongoose").Model<any, any, any, any, any, any, any>, {}, {}, {}, {}, import("mongoose").DefaultSchemaOptions, {
    type: string;
    link: string;
    userId: Types.ObjectId;
    title: string;
    tags: Types.ObjectId[];
}, import("mongoose").Document<unknown, {}, {
    type: string;
    link: string;
    userId: Types.ObjectId;
    title: string;
    tags: Types.ObjectId[];
}, {
    id: string;
}, import("mongoose").DefaultSchemaOptions> & Omit<{
    type: string;
    link: string;
    userId: Types.ObjectId;
    title: string;
    tags: Types.ObjectId[];
} & {
    _id: Types.ObjectId;
} & {
    __v: number;
}, "id"> & {
    id: string;
}, unknown, {
    type: string;
    link: string;
    userId: Types.ObjectId;
    title: string;
    tags: Types.ObjectId[];
} & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>, {
    type: string;
    link: string;
    userId: Types.ObjectId;
    title: string;
    tags: Types.ObjectId[];
} & {
    _id: Types.ObjectId;
} & {
    __v: number;
}>;
//# sourceMappingURL=Content.d.ts.map