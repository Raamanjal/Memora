import { Schema, model, Types } from "mongoose";

const EmbeddingSchema = new Schema(
    {
        contentId: {
            type: Types.ObjectId,
            ref: "Content",
            required: true,
            index: true,
        },
        userId: {
            type: Types.ObjectId,
            ref: "User",
            required: true,
            index: true,
        },
        chunkText: {
            type: String,
            required: true,
        },
        chunkIndex: {
            type: Number,
            required: true,
        },
        // Atlas Vector Search index in the MongoDB Atlas UI:
        //   Collection: embeddings
        //   Field: vector
        //   Dimensions: 768
        //   Similarity: cosine
        vector: {
            type: [Number],
            required: true,
        },
    },
    { timestamps: true }
);

EmbeddingSchema.index({ userId: 1, contentId: 1 });

export const Embedding = model("Embedding", EmbeddingSchema);
