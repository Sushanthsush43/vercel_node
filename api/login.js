const express = require("express");
const { db, admin } = require("../firebase");

const router = express.Router();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function storeOTP(phoneNumber, otp) {
  const expiresAt = db.Timestamp.fromDate(new Date(Date.now() + 10 * 60 * 1000));
  await db.collection("pendingVerifications").doc(phoneNumber).set({
    otp,
    expiresAt,
    createdAt: admin.firestore.FieldValue.serverTimestamp()
,
  });
}

router.post("/login", async (req, res) => {
  const { phoneNumber } = req.body;

  if (!phoneNumber) {
    return res.status(400).json({ error: "Phone number is required" });
  }

  try {
    console.log(`Processing login request for phone: ${phoneNumber}`);

    const snapshot = await db
      .collection("users")
      .where("phoneNumber", "==", phoneNumber)
      .get();

    if (snapshot.empty) {
      return res.status(404).json({ error: "Phone number not registered" });
    }

    const otp = generateOTP();
    console.log(`Generated OTP: ${otp}`);

    await storeOTP(phoneNumber, otp);
    console.log(`Stored OTP for phone: ${phoneNumber}`);

    const userDoc = snapshot.docs[0];
    const userId = userDoc.data().userId;
    console.log(`Found userId: ${userId}`);

    res.status(200).json({ message: "OTP generated", userId, otp });
  } catch (error) {
    console.error("Error in login:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

module.exports = router;
