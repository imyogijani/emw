// import mongoose from 'mongoose';

// const menuItemSchema = new mongoose.Schema({
//   name: {
//     type: String,
//     required: true,
//     trim: true,
//   },
//   description: {
//     type: String,
//     trim: true,
//   },
//   price: {
//     type: Number,
//     required: true,
//     min: 0,
//   },
//   category: {
//     type: String,
//     trim: true,
//   },
//   image: {
//     type: String,
//     trim: true,
//   },
//   isAvailable: {
//     type: Boolean,
//     default: true,
//   },
//   isPremium: {
//     type: Boolean,
//     default: false,
//   },
// }, { timestamps: true });

// const MenuItem = mongoose.model('MenuItem', menuItemSchema);

// export default MenuItem;

import mongoose from "mongoose";

const menuItemSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    filterType: {
      type: String,
      enum: ["Category", "Seller", "Brand", "custom"],
      required: true,
    },
    filterValue: {
      type: mongoose.Schema.Types.ObjectId,
      refPath: "filterType", // dynamically references Category, Seller, Brand
      required: function () {
        return this.filterType !== "custom";
      },
    },
    productLimit: {
      type: Number,
      default: 10,
      min: 1,
      max: 50,
    },
    customProducts: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
      },
    ],
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
    position: {
      type: Number,
      default: 0, // lower position → show first
    },
  },
  { timestamps: true }
);

menuItemSchema.index({ position: 1 });
menuItemSchema.index({ filterType: 1, filterValue: 1 });

const MenuItem = mongoose.model("MenuItem", menuItemSchema);
export default MenuItem;
