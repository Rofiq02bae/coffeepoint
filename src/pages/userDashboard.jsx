import { useEffect, useState } from "react";
import { db, REDEEM_THRESHOLD } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
  increment,
  getDocs,
  collection,
} from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";

function UserDashboard() {
  const [deviceId, setDeviceId] = useState(null);
  const [count, setCount] = useState(0);
  const [voucher, setVoucher] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingVouchers, setLoadingVouchers] = useState(false);
  const [redeeming, setRedeeming] = useState(false);
  const [error, setError] = useState(null);

  // Fetch user data
  const fetchUserData = async (id) => {
    if (!id) return;
    try {
      setError(null);
      const userRef = doc(db, "users", id);
      const snap = await getDoc(userRef);
      if (snap.exists()) {
        setCount(snap.data().count || 0);
      } else {
        await setDoc(userRef, { count: 0 });
        setCount(0);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      setError("Gagal memuat data pengguna. Silakan coba lagi.");
    }
  };

  // Fetch vouchers
  const fetchVouchers = async (id) => {
    if (!id) return;
    try {
      setLoadingVouchers(true);
      setError(null);
      const snap = await getDocs(collection(db, "tokens"));
      const voucherList = snap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .filter((item) => item.type === "voucher" && item.from_user === id && (item.used_by?.length ?? 0) === 0);
      setVouchers(voucherList);
    } catch (error) {
      console.error("Error fetching vouchers:", error);
      setError("Gagal memuat voucher. Silakan coba lagi.");
    } finally {
      setLoadingVouchers(false);
    }
  };

  // Ambil ID device dari localStorage
  useEffect(() => {
    try {
      let id = localStorage.getItem("deviceId");
      if (!id) {
        id = crypto.randomUUID();
        localStorage.setItem("deviceId", id);
      }
      setDeviceId(id);
    } catch (error) {
      console.error("Error setting device ID:", error);
      setError("Gagal menginisialisasi device. Silakan refresh halaman.");
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      if (deviceId) {
        setLoading(true);
        await Promise.all([
          fetchUserData(deviceId),
          fetchVouchers(deviceId)
        ]);
        setLoading(false);
      }
    };
    loadData();
  }, [deviceId]);

  const redeem = async () => {
    if (count < REDEEM_THRESHOLD) {
      alert(`Poin belum cukup! Anda perlu minimal ${REDEEM_THRESHOLD} poin.`);
      return;
    }

    setRedeeming(true);
    setError(null);
    
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
      await Promise.all([
        fetchUserData(deviceId),
        fetchVouchers(deviceId)
      ]);
      
    } catch (error) {
      console.error("Error redeeming voucher:", error);
      setError("Gagal menukar voucher. Silakan coba lagi.");
      // Refresh data in case of partial failure
      await fetchUserData(deviceId);
    } finally {
      setRedeeming(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h2>⏳ Memuat...</h2>
        <p>Sedang mengambil data Anda...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem", textAlign: "center" }}>
      {error && (
        <div style={{ 
          background: "#ffebee", 
          color: "#c62828", 
          padding: "10px", 
          borderRadius: "4px", 
          marginBottom: "20px",
          border: "1px solid #ef5350"
        }}>
          ⚠️ {error}
          <button 
            onClick={() => {
              setError(null);
              if (deviceId) {
                fetchUserData(deviceId);
                fetchVouchers(deviceId);
              }
            }}
            style={{ marginLeft: "10px", fontSize: "12px" }}
          >
            🔄 Coba Lagi
          </button>
        </div>
      )}
      
      <h2>☕ Poin Kamu: {count}</h2>
      <p style={{ color: "#666", marginBottom: "20px" }}>
        Minimal {REDEEM_THRESHOLD} poin untuk menukar voucher
      </p>
      
      <button
        onClick={redeem}
        disabled={count < REDEEM_THRESHOLD || redeeming}
        style={{
          padding: "10px 20px",
          margin: "20px 0",
          borderRadius: "6px",
          background: count < REDEEM_THRESHOLD || redeeming ? "#ccc" : "#4caf50",
          color: "white",
          cursor: count < REDEEM_THRESHOLD || redeeming ? "not-allowed" : "pointer",
          border: "none",
          fontSize: "16px"
        }}
      >
        {redeeming ? "⏳ Memproses..." : "🎁 Tukar Voucher"}
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
      
      <div style={{ marginTop: "30px" }}>
        <h3>🎟️ Voucher Aktif: {loadingVouchers ? "⏳" : vouchers.length}</h3>
        {loadingVouchers ? (
          <p>Memuat voucher...</p>
        ) : vouchers.length === 0 ? (
          <p style={{ color: "#666" }}>Belum ada voucher aktif</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {vouchers.map((v) => (
              <li key={v.id} style={{ marginBottom: "20px" }}>
                <QRCodeSVG value={`${window.location.origin}/redeem?token=${v.id}`} size={120} />
                <p><a href={`/redeem?token=${v.id}`} target="_blank">🔗 Gunakan Voucher</a></p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

export default UserDashboard;
