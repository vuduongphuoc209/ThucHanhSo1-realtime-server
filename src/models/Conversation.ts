import mongoose, { Document, Schema, Types } from "mongoose";

export interface IConversation extends Document {
  participants: Types.ObjectId[];
  type: "private" | "group";
  name?: string;
  avatar?: string;
  lastMessage?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const conversationSchema = new Schema<IConversation>(
  {
    participants: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],

    type: {
      type: String,
      enum: ["private", "group"],
      default: "private",
    },

    name: {
      type: String,
      trim: true,
    },

    avatar: {
      type: String,
      default: "",
    },

    lastMessage: {
      type: Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  {
    timestamps: true,
  },
);

conversationSchema.index({
  participants: 1,
});

const Conversation = mongoose.model<IConversation>(
  "Conversation",
  conversationSchema,
);

export default Conversation;
