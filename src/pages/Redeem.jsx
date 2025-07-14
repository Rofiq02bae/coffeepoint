import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  increment,
  setDoc
} from "firebase/firestore";
import { useSearchParams } from "react-router-dom";

function Redeem() {
  const [status, setStatus] = useState("⏳ Memproses...");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [deviceId, setDeviceId] = useState(null);

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
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token && deviceId) handleRedeem();
    else if (!token) {
      setStatus("❌ Token tidak ditemukan dalam URL.");
      setLoading(false);
    }
  }, [token, deviceId]);

  const handleRedeem = async () => {
    try {
      setLoading(true);
      setError(null);
      setStatus("🔍 Memeriksa voucher...");

      const tokenRef = doc(db, "tokens", token);
      const snap = await getDoc(tokenRef);

      if (!snap.exists()) {
        setStatus("❌ Token tidak valid atau sudah tidak tersedia.");
        setLoading(false);
        return;
      }

      const data = snap.data();
      const alreadyUsed = (data.used_by || []).includes(deviceId);

      if (alreadyUsed) {
        setStatus("⚠️ Voucher sudah pernah digunakan oleh perangkat ini.");
        setLoading(false);
        return;
      }

      if ((data.used_by || []).length > 0) {
        setStatus("❌ Voucher ini sudah digunakan oleh pengguna lain.");
        setLoading(false);
        return;
      }

      setStatus("💾 Menyimpan poin...");

      // tandai token sebagai digunakan
      await updateDoc(tokenRef, {
        used_by: arrayUnion(deviceId),
      });

      // tambah poin user
      const userRef = doc(db, "users", deviceId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        await updateDoc(userRef, {
          count: increment(1),
        });
      } else {
        // Jika user belum ada, buat baru dengan poin 1
        await setDoc(userRef, {
          count: 1,
        });
      }

      setStatus("✅ Voucher berhasil digunakan! +1 poin telah ditambahkan.");
      
    } catch (error) {
      console.error("Error redeeming voucher:", error);
      setError("Terjadi kesalahan saat memproses voucher. Silakan coba lagi.");
      setStatus("❌ Gagal memproses voucher.");
    } finally {
      setLoading(false);
    }
  };

  const retryRedeem = () => {
    if (token && deviceId) {
      setError(null);
      handleRedeem();
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "20vh", padding: "2rem" }}>
      <h1>🎟️ Penukaran Voucher</h1>
      
      {loading && (
        <div style={{ margin: "20px 0" }}>
          <div style={{ 
            display: "inline-block", 
            width: "40px", 
            height: "40px", 
            border: "4px solid #f3f3f3",
            borderTop: "4px solid #2196f3",
            borderRadius: "50%",
            animation: "spin 1s linear infinite"
          }}></div>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      )}

      <p style={{ 
        fontSize: "18px", 
        margin: "20px 0",
        color: status.includes("✅") ? "#4caf50" : 
              status.includes("❌") || status.includes("⚠️") ? "#f44336" : 
              "#666"
      }}>
        {status}
      </p>

      {error && (
        <div style={{ 
          background: "#ffebee", 
          color: "#c62828", 
          padding: "15px", 
          borderRadius: "8px", 
          margin: "20px auto",
          maxWidth: "500px",
          border: "1px solid #ef5350"
        }}>
          <p>⚠️ {error}</p>
          <button 
            onClick={retryRedeem}
            style={{
              background: "#2196f3",
              color: "white",
              border: "none",
              padding: "8px 16px",
              borderRadius: "4px",
              cursor: "pointer",
              marginTop: "10px"
            }}
          >
            🔄 Coba Lagi
          </button>
        </div>
      )}

      {!loading && !error && (
        <div style={{ marginTop: "30px" }}>
          <a 
            href="/me" 
            style={{
              display: "inline-block",
              background: "#4caf50",
              color: "white",
              padding: "12px 24px",
              borderRadius: "6px",
              textDecoration: "none",
              marginRight: "10px"
            }}
          >
            📊 Lihat Dashboard Saya
          </a>
          <a 
            href="/" 
            style={{
              display: "inline-block",
              background: "#2196f3",
              color: "white",
              padding: "12px 24px",
              borderRadius: "6px",
              textDecoration: "none"
            }}
          >
            🏠 Ke Beranda
          </a>
        </div>
      )}
    </div>
  );
}

export default Redeem;
