import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion
} from "firebase/firestore";
import { useSearchParams } from "react-router-dom";

function Redeem() {
  const [status, setStatus] = useState("⏳ Memproses...");
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [deviceId, setDeviceId] = useState(null);

  useEffect(() => {
    let id = localStorage.getItem("deviceId");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("deviceId", id);
    }
    setDeviceId(id);
  }, []);

  useEffect(() => {
    if (token && deviceId) handleRedeem();
  }, [token, deviceId]);

  const handleRedeem = async () => {
    try {
      const tokenRef = doc(db, "tokens", token);
      const snap = await getDoc(tokenRef);

      if (!snap.exists()) {
        setStatus("❌ Token tidak valid.");
        return;
      }

      const data = snap.data();
      const alreadyUsed = (data.used_by || []).includes(deviceId);

      if (alreadyUsed) {
        setStatus("⚠️ Voucher sudah pernah digunakan oleh perangkat ini.");
        return;
      }

      if ((data.used_by || []).length > 0) {
        setStatus("❌ Voucher ini sudah digunakan.");
        return;
      }

      // tandai token sebagai digunakan
      await updateDoc(tokenRef, {
        used_by: arrayUnion(deviceId),
      });

      // tambah poin user
      const userRef = doc(db, "users", deviceId);
      await updateDoc(userRef, {
        count: increment(1),
      });

      setStatus("✅ Voucher berhasil digunakan! +1 poin.");
    } catch (e) {
      console.error(e);
      setStatus("❌ Terjadi kesalahan saat memproses token.");
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20vh" }}>
      <h1>🎟️ Penukaran Voucher</h1>
      <p>{status}</p>
    </div>
  );
}

export default Redeem;
