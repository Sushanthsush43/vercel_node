const express = require("express");
const { db, admin } = require("../firebase");

const router = express.Router();

async function getNextUserId() {
  const counterRef = db.collection("metadata").doc("userCounter");
  return db.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    let newId;
    if (!counterDoc.exists) {
      newId = 1;
      transaction.set(counterRef, { lastId: newId });
    } else {
      const lastId = counterDoc.data().lastId || 0;
      newId = lastId + 1;
      transaction.update(counterRef, { lastId: newId });
    }
    return newId;
  });
}

router.post("/register", async (req, res) => {
  const { phoneNumber, fullName, email } = req.body;

  if (!phoneNumber || !fullName || !email) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    console.log(`Processing register request for phone: ${phoneNumber}`);

    const snapshot = await db
      .collection("users")
      .where("phoneNumber", "==", phoneNumber)
      .get();

    if (!snapshot.empty) {
      return res.status(400).json({ error: "Phone number already registered" });
    }

    const userId = await getNextUserId();
    console.log(`Assigned userId: ${userId}`);

    await db.collection("users").doc(userId.toString()).set({
      userId,
      phoneNumber,
      fullName,
      email,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).json({ message: "User registered successfully", userId });
  } catch (error) {
    console.error("Error in register:", error.message);
    res.status(500).json({ error: "Server error", details: error.message });
  }
});

module.exports = router;
