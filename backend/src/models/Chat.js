import mongoose from "mongoose";

const chatSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
      default: ""
    },
    isGroup: {
      type: Boolean,
      default: false
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
      }
    ],
    admins: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],
    lastMessage: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message"
    }
  },
  { timestamps: true }
);

chatSchema.index({ members: 1 });

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
