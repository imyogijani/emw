import TechnicalDetails from "../models/technicalDetails.js";

//  Create
// export const createTechnicalDetails = async (req, res) => {
//   try {
//     const details = new TechnicalDetails(req.body);
//     const saved = await details.save();
//     res.status(201).json(saved);
//   } catch (err) {
//     res.status(400).json({ message: err.message });
//   }
// };

export const createTechnicalDetails = async (req, res) => {
  const { title } = req.body;

  if (!title || title.trim() === "") {
    return res.status(400).json({ message: "Title is required" });
  }

  const technicalDetails = await TechnicalDetails.create({
    ...req.body,
    createdBy: req.userId,
  });

  res.status(201).json({
    message: "Technical Details Created",
    technicalDetails,
  });
};

//  Update
export const updateTechnicalDetails = async (req, res) => {
  try {
    const updated = await TechnicalDetails.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );
    if (!updated) return res.status(404).json({ message: "Details not found" });
    res.status(200).json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

//  Delete
export const deleteTechnicalDetails = async (req, res) => {
  try {
    const deleted = await TechnicalDetails.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: "Not found" });
    res.status(200).json({ message: "Technical details deleted successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

//  Get one (optional)
export const getTechnicalDetailsById = async (req, res) => {
  try {
    // const data = await TechnicalDetails.findById(req.params.id);
    const data = await TechnicalDetails.findById(req.params.id);
    if (!data) return res.status(404).json({ message: "Not found" });
    res.status(200).json(data);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

export const getMyTechnicalDetails = async (req, res) => {
  const details = await TechnicalDetails.find({ createdBy: req.userId }).select(
    "title"
  ); // just title for dropdown
  res.status(200).json(details);
};

export const getAllTechnicalDetails = async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  try {
    const [data, total] = await Promise.all([
      TechnicalDetails.find()
        .populate("createdBy", "name email") // seller ka naam/email
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),

      TechnicalDetails.countDocuments(),
    ]);

    res.status(200).json({
      total,
      page,
      pages: Math.ceil(total / limit),
      data,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
