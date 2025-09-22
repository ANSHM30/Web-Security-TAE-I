const mongoose = require("mongoose");

const logSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    email: { type: String, required: true },
    success: { type: Boolean, required: true },
    ip: { type: String, default: "unknown" },
    userAgent: { type: String, default: "unknown" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Log", logSchema);


