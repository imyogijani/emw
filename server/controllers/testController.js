const testController = (req, res) => {
  res.status(200).send({
    message: "Food delivery app is running",
    success: true,
  });
};

export { testController };
// module.exports = { testController };
