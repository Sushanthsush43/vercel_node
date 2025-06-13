import { admin, db } from '../../lib/firebaseAdmin';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({ error: 'Phone number is required' });
    }

    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('phone', '==', phone).get();

    if (snapshot.empty) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Simulated OTP process (replace with real logic as needed)
    const otp = Math.floor(100000 + Math.random() * 900000);
    console.log(`OTP sent to ${phone}: ${otp}`);

    // Optionally save OTP in DB (not recommended in plaintext in prod)
    await usersRef.doc(snapshot.docs[0].id).update({ lastOtp: otp });

    return res.status(200).json({ message: 'OTP sent successfully', otp }); // don't return OTP in prod
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
