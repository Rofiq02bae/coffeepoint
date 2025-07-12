import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

function App() {
  const [status, setStatus] = useState("Loading...");
  const [count, setCount] = useState(0);

  const docId = "contoh@wallet"; // nanti bisa ganti jadi wallet address user beneran

  // Ambil data awal saat halaman dibuka
  useEffect(() => {
    const fetchData = async () => {
      try {
        const ref = doc(db, "users", docId);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          setCount(data.count || 0);
          setStatus("✅ Data berhasil dimuat");
        } else {
          // kalau belum ada datanya, buat dengan count = 0
          await setDoc(ref, { count: 0 });
          setCount(0);
          setStatus("📦 Data baru dibuat");
        }
      } catch (err) {
        setStatus("❌ Gagal ambil data: " + err.message);
      }
    };

    fetchData();
  }, []);

  // Fungsi tambah poin
  const tambahPoin = async () => {
    try {
      const ref = doc(db, "users", docId);
      const newCount = count + 1;
      await updateDoc(ref, { count: newCount });
      setCount(newCount);
      setStatus("🎉 Poin berhasil ditambahkan!");
    } catch (err) {
      setStatus("❌ Gagal menambah poin: " + err.message);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "30vh" }}>
      <h1>CoffeePoint ☕</h1>
      <p>Poin kamu: <strong>{count}</strong></p>
      <button onClick={tambahPoin} style={{ padding: "10px 20px", fontSize: "16px" }}>
        ➕ Tambah Ngopi
      </button>
      <p style={{ marginTop: "20px", color: "#888" }}>{status}</p>
    </div>
  );
}

export default App;