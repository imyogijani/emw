import mongoose from "mongoose";

// ==================== Country Schema ====================
const countrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  },
  { timestamps: true }
);

// Pre-save validation: prevent duplicate country
countrySchema.pre("save", async function (next) {
  if (this.isModified("name")) {
    const existing = await Country.findOne({
      name: { $regex: new RegExp(`^${this.name}$`, "i") },
    });
    if (existing) return next(new Error("Country already exists"));
  }
  next();
});

// ==================== State Schema ====================
const stateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    country: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Country",
      required: true,
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  },
  { timestamps: true }
);

// Pre-save validation: prevent duplicate state in same country
stateSchema.pre("save", async function (next) {
  if (this.isModified("name") || this.isModified("country")) {
    const existing = await State.findOne({
      name: { $regex: new RegExp(`^${this.name}$`, "i") },
      country: this.country,
    });
    if (existing)
      return next(new Error("State already exists in this country"));
  }
  next();
});

// ==================== City Schema ====================
const citySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    state: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "State",
      required: true,
    },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  },
  { timestamps: true }
);

// Pre-save validation: prevent duplicate city in same state
citySchema.pre("save", async function (next) {
  if (this.isModified("name") || this.isModified("state")) {
    const existing = await City.findOne({
      name: { $regex: new RegExp(`^${this.name}$`, "i") },
      state: this.state,
    });
    if (existing) return next(new Error("City already exists in this state"));
  }
  next();
});

// ==================== Pincode / Area Schema ====================
const pincodeSchema = new mongoose.Schema(
  {
    pincode: {
      type: String,
      required: true,
      trim: true,
      match: [/^\d{6}$/, "Invalid pincode"],
    },
    areaName: { type: String, required: true, trim: true },
    city: { type: mongoose.Schema.Types.ObjectId, ref: "City", required: true },
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "users" },
  },
  { timestamps: true }
);

pincodeSchema.pre("save", async function (next) {
  try {
    // Sirf jab pincode, areaName, ya city change ho raha ho
    if (
      this.isModified("pincode") ||
      this.isModified("areaName") ||
      this.isModified("city")
    ) {
      const existing = await Pincode.findOne({
        city: this.city,
        pincode: this.pincode,
        areaName: { $regex: new RegExp(`^${this.areaName}$`, "i") }, // case-insensitive
      });

      if (existing) {
        return next(
          new Error(
            "❌ Same area name with same pincode already exists in this city"
          )
        );
      }
    }
    next();
  } catch (err) {
    next(err);
  }
});

// ==================== Models ====================
const Country = mongoose.model("Country", countrySchema);
const State = mongoose.model("State", stateSchema);
const City = mongoose.model("City", citySchema);
const Pincode = mongoose.model("Pincode", pincodeSchema);

export { Country, State, City, Pincode };
export default { Country, State, City, Pincode };
