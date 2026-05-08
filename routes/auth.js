const router = require("express").Router();
const {
  login,
  me,
  updateProfile,
  changePassword,
  forgotPassword,
  verifyOtp,
  resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/auth");

router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/verify-otp", verifyOtp);
router.post("/reset-password", resetPassword);

router.get("/me", protect, me);
router.put("/profile", protect, updateProfile);
router.post("/change-password", protect, changePassword);

module.exports = router;
