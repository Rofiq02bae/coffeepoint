import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment
} from "firebase/firestore";

function Redeem() {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState("Memproses...");
  const [points, setPoints] = useState(null);

  useEffect(() => {
    const redeemToken = async () => {
      const token = searchParams.get("token");
      if (!token) {
        setStatus("❌ Token tidak ditemukan.");
        return;
      }

      let deviceId = localStorage.getItem("device_id");
      if (!deviceId) {
        deviceId = crypto.randomUUID();
        localStorage.setItem("device_id", deviceId);
      }

      const tokenRef = doc(db, "tokens", token);
      const tokenSnap = await getDoc(tokenRef);

      if (!tokenSnap.exists()) {
        setStatus("❌ Token tidak valid.");
        return;
      }

      const data = tokenSnap.data();
      if (data.used_by?.includes(deviceId)) {
        setStatus("⚠️ Token ini sudah kamu gunakan.");
        return;
      }

      // Tambahkan ke 'used_by'
      const updatedUsedBy = [...(data.used_by || []), deviceId];
      await updateDoc(tokenRef, {
        used_by: updatedUsedBy,
        used_at: new Date()
      });

      // Tambah poin user (by device)
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

    redeemToken();
  }, [searchParams]);

  return (
    <div style={{ textAlign: "center", marginTop: "25vh" }}>
      <h1>Redeem QR 🎉</h1>
      <p>{status}</p>
      {points !== null && <p>Total poinmu: {points}</p>}
    </div>
  );
}

export default Redeem;
