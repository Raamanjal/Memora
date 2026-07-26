import { Schema, model, Types } from "mongoose";

const TagSchema = new Schema({
  title: { type: String, required: true, trim: true },
  userId: { type: Types.ObjectId, ref: "User", required: true },
});

TagSchema.index({ userId: 1, title: 1 }, { unique: true });

export const Tag = model("Tag", TagSchema);
