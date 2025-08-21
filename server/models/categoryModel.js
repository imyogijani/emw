import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    slug: {
      type: String,
      lowercase: true,
      unique: true,
      index: true,
    },
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
    children: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    image: {
      type: String, // URL or path to the image
      default: "",
    },
    gstPercentage: {
      type: Number,
      min: 0,
      max: 50,
      default: 0, // default 0% GST
    },
    defaultHsnCode: {
      type: String,
      trim: true,
      default: null,
    },
    brands: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Brand",
      },
    ],
  },

  { timestamps: true }
);

const Category = mongoose.model("Category", categorySchema);

export default Category;
