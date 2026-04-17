function errorHandler(err, req, res, next) {
  console.error("Error:", err.message);
  if (err.code === "P2002") return res.status(409).json({ error: "Duplicate record." });
  if (err.code === "P2025") return res.status(404).json({ error: "Record not found." });
  res.status(err.status || 500).json({ error: err.message || "Internal server error." });
}
module.exports = { errorHandler };
