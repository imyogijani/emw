import mongoose from "mongoose";

const attributeRuleSchema = new mongoose.Schema({
  subCategoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  fields: [
    {
      key: { type: String, required: true }, // e.g. "ram"
      label: { type: String, required: true }, // e.g. "RAM Size"
      type: {
        type: String,
        enum: ["string", "number", "date", "boolean", "select", "object"],
        default: "string",
      },
      required: { type: Boolean, default: false },
      options: { type: [String] }, // For dropdown select
    },
  ],
});

export default mongoose.model("AttributeRule", attributeRuleSchema);
