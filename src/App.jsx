import { useEffect, useState } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

function App() {
  const [wallet, setWallet] = useState("");
  const [count, setCount] = useState(0);
  const [status, setStatus] = useState("🔄 Menyambungkan wallet...");

  // Connect ke Metamask dan ambil wallet address
  useEffect(() => {
    const connectWallet = async () => {
      if (window.ethereum) {
        try {
          const accounts = await window.ethereum.request({
            method: "eth_requestAccounts",
          });
          const address = accounts[0];
          setWallet(address);
          setStatus("✅ Wallet terhubung: " + address.slice(0, 6) + "..." + address.slice(-4));

          // Setelah wallet didapat, ambil atau buat data Firestore
          const userRef = doc(db, "users", address);
          const snap = await getDoc(userRef);

          if (snap.exists()) {
            const data = snap.data();
            setCount(data.count || 0);
          } else {
            await setDoc(userRef, { count: 0 });
            setCount(0);
          }
        } catch (err) {
          setStatus("❌ Gagal menghubungkan wallet: " + err.message);
        }
      } else {
        setStatus("❌ Metamask tidak ditemukan. Install dulu ya.");
      }
    };

    connectWallet();
  }, []);

  // Fungsi tambah poin
  const tambahPoin = async () => {
    if (!wallet) {
      setStatus("⚠️ Wallet belum terhubung.");
      return;
    }

    try {
      const userRef = doc(db, "users", wallet);
      const newCount = count + 1;
      await updateDoc(userRef, { count: newCount });
      setCount(newCount);
      setStatus("☕ Poin ngopi ditambah jadi " + newCount);
    } catch (err) {
      setStatus("❌ Gagal menambah poin: " + err.message);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "25vh" }}>
      <h1>CoffeePoint ☕</h1>
      <p style={{ fontSize: "18px" }}>Poin kamu: <strong>{count}</strong></p>
      <button
        onClick={tambahPoin}
        style={{ padding: "10px 20px", fontSize: "16px", marginTop: "10px" }}
      >
        ➕ Tambah Ngopi
      </button>
      <p style={{ marginTop: "20px", color: "#888" }}>{status}</p>
    </div>
  );
}

export default App;