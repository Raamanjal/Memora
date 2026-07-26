import { Schema, model, Types } from "mongoose";
import "./Tag.js";
const contentTypes = ['image', 'video', 'article', 'audio', 'tweet', 'pdf']; // Extend as needed
const contentSchema = new Schema({
    link: { type: String, required: true },
    type: { type: String, enum: contentTypes, required: true },
    title: { type: String, required: true },
    tags: [{ type: Types.ObjectId, ref: 'Tag' }],
    userId: { type: Types.ObjectId, ref: 'User', required: true },
});
export const content = model("Content", contentSchema);
//# sourceMappingURL=Content.js.map