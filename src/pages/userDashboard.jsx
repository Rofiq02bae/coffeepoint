import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
  increment,
  getDocs,
  collection, // PERLU DITAMBAH
} from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";

const REDEEM_THRESHOLD = 5;


function UserDashboard() {
  const [deviceId, setDeviceId] = useState(null);
  const [count, setCount] = useState(0);
  const [voucher, setVoucher] = useState(null);
  const [vouchers, setVouchers] = useState([]);

  // Fetch user data
  const fetchUserData = async (id) => {
    if (!id) return;
    const userRef = doc(db, "users", id);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      setCount(snap.data().count || 0);
    } else {
      await setDoc(userRef, { count: 0 });
      setCount(0);
    }
  };

  // Fetch vouchers
  const fetchVouchers = async (id) => {
    if (!id) return;
    const snap = await getDocs(collection(db, "tokens"));
    const voucherList = snap.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((item) => item.type === "voucher" && item.from_user === id && (item.used_by?.length ?? 0) === 0);
    setVouchers(voucherList);
  };

  // Ambil ID device dari localStorage
  useEffect(() => {
    let id = localStorage.getItem("deviceId");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("deviceId", id);
    }
    setDeviceId(id);
  }, []);

  useEffect(() => {
    if (deviceId) {
      fetchUserData(deviceId);
      fetchVouchers(deviceId);
    }
  }, [deviceId]);

  const redeem = async () => {
    if (count < REDEEM_THRESHOLD) return alert("Poin belum cukup!");
    try {
      const userRef = doc(db, "users", deviceId);
      const tokenId = crypto.randomUUID();
      const tokenRef = doc(db, "tokens", tokenId);
      // 1. Kurangi poin
      await updateDoc(userRef, {
        count: increment(-REDEEM_THRESHOLD),
      });
      // 2. Buat token baru
      await setDoc(tokenRef, {
        created_at: serverTimestamp(),
        used_by: [],
        type: "voucher",
        from_user: deviceId,
      });
      setVoucher({
        id: tokenId,
        url: `${window.location.origin}/redeem?token=${tokenId}`,
      });
      // Refresh count & vouchers
      fetchUserData(deviceId);
      fetchVouchers(deviceId);
    } catch (e) {
      console.error("Gagal tukar voucher:", e);
    }
  };

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      <h2>☕ Poin Kamu: {count}</h2>
      <button
        onClick={redeem}
        disabled={count < REDEEM_THRESHOLD}
        style={{
          padding: "10px 20px",
          margin: "20px 0",
          borderRadius: "6px",
          background: count < REDEEM_THRESHOLD ? "#ccc" : "#4caf50",
          color: "white",
          cursor: count < REDEEM_THRESHOLD ? "not-allowed" : "pointer",
        }}
      >
        🎁 Tukar Voucher
      </button>
      {voucher && (
        <div style={{ marginTop: "30px" }}>
          <h3>🎉 Voucher Kamu</h3>
          <QRCodeSVG value={voucher.url} size={180} />
          <p>
            <a href={voucher.url} target="_blank" rel="noreferrer">
              🔗 {voucher.url}
            </a>
          </p>
        </div>
      )}
      <h3>🎟️ Voucher Aktif: {vouchers.length}</h3>
      <ul>
        {vouchers.map((v) => (
          <li key={v.id}>
            <QRCodeSVG value={`${window.location.origin}/redeem?token=${v.id}`} size={120} />
            <p><a href={`/redeem?token=${v.id}`} target="_blank">🔗 Gunakan Voucher</a></p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default UserDashboard;
