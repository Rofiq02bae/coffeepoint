import { useEffect, useState } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

function App() {
  const [deviceId, setDeviceId] = useState("");
  const [count, setCount] = useState(0);
  const [lastScan, setLastScan] = useState(null);
  const [status, setStatus] = useState("🔄 Memuat...");

  const jedaJam = 6; // ubah ke 3, 12, atau 24 kalau mau

  // Ambil atau buat ID dari localStorage
  useEffect(() => {
    let id = localStorage.getItem("device_id");
    if (!id) {
      id = crypto.randomUUID(); // Buat ID unik
      localStorage.setItem("device_id", id);
    }
    setDeviceId(id);
  }, []);

  // Ambil data Firestore berdasarkan device
  useEffect(() => {
    if (!deviceId) return;

    const fetchData = async () => {
      const ref = doc(db, "users", deviceId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setCount(data.count || 0);
        setLastScan(data.lastScan?.toDate());
        setStatus("✅ Siap scan hari ini!");
      } else {
        await setDoc(ref, { count: 0, lastScan: null });
        setCount(0);
        setLastScan(null);
        setStatus("📦 Data baru dibuat.");
      }
    };

    fetchData();
  }, [deviceId]);

  // Fungsi tambah poin jika jeda sudah cukup
  const tambahPoin = async () => {
    const now = new Date();
    const ref = doc(db, "users", deviceId);

    if (lastScan) {
      const selisihJam = (now - lastScan) / (1000 * 60 * 60);
      const sisaJam = Math.ceil(jedaJam - selisihJam);

      if (selisihJam < jedaJam) {
        setStatus(`⏳ Belum bisa. Coba lagi dalam ${sisaJam} jam.`);
        return;
      }
    }

    try {
      const newCount = count + 1;
      await updateDoc(ref, {
        count: newCount,
        lastScan: now,
      });
      setCount(newCount);
      setLastScan(now);
      setStatus(`🎉 Poin berhasil ditambah! Total: ${newCount}`);
    } catch (err) {
      setStatus("❌ Gagal menambah poin: " + err.message);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "25vh" }}>
      <h1>CoffeePoint ☕</h1>
      <p><strong>ID Device:</strong> {deviceId.slice(0, 6)}...{deviceId.slice(-4)}</p>
      <p><strong>Total Poin:</strong> {count}</p>
      <button
        onClick={tambahPoin}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          marginTop: "10px",
          borderRadius: "8px",
        }}
      >
        ➕ Tambah Poin
      </button>
      <p style={{ marginTop: "20px", color: "#555" }}>{status}</p>
    </div>
  );
}

export default App;
