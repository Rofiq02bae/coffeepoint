import { useSearchParams } from "react-router-dom";
import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  doc, getDoc, setDoc, updateDoc, increment
} from "firebase/firestore";

function Redeem() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("⏳ Memproses...");
  const [points, setPoints] = useState(null);

  useEffect(() => {
    const redeem = async () => {
      const token = searchParams.get("token");
      if (!token) return setStatus("❌ Token tidak ditemukan.");

      let deviceId = localStorage.getItem("device_id");
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("device_id", deviceId);
      }

      const tokenRef = doc(db, "tokens", token);
      const tokenSnap = await getDoc(tokenRef);

      if (!tokenSnap.exists()) return setStatus("❌ Token tidak valid.");

      const tokenData = tokenSnap.data();
      if ((tokenData.used_by || []).includes(deviceId)) {
        return setStatus("⚠️ Kamu sudah pakai token ini.");
      }

      await updateDoc(tokenRef, {
        used_by: [...(tokenData.used_by || []), deviceId],
        used_at: new Date()
      });

      const userRef = doc(db, "users", deviceId);
      const userSnap = await getDoc(userRef);

      if (!userSnap.exists()) {
        await setDoc(userRef, { count: 1 });
        setPoints(1);
      } else {
        const current = userSnap.data().count || 0;
        await updateDoc(userRef, { count: increment(1) });
        setPoints(current + 1);
      }

      setStatus("✅ Poin berhasil ditambahkan!");
    };

    redeem();
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "25vh" }}>
      <h1>🎉 Redeem Token</h1>
      <p>{status}</p>
      {points !== null && <p>Total Poin: {points}</p>}
    </div>
  );
}

export default Redeem;
