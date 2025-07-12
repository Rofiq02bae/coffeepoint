import { useEffect, useState } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";

function App() {
  const [wallet, setWallet] = useState("");
  const [count, setCount] = useState(0);
  const [voucher, setVoucher] = useState(0);
  const [status, setStatus] = useState("🔄 Menghubungkan wallet...");

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

          const userRef = doc(db, "users", address);
          const snap = await getDoc(userRef);

          if (snap.exists()) {
            const data = snap.data();
            setCount(data.count || 0);
            setVoucher(data.voucher || 0);
          } else {
            await setDoc(userRef, { count: 0, voucher: 0 });
            setCount(0);
            setVoucher(0);
          }
        } catch (err) {
          setStatus("❌ Gagal menghubungkan wallet: " + err.message);
        }
      } else {
        setStatus("❌ Metamask tidak ditemukan.");
      }
    };

    connectWallet();
  }, []);

  // Fungsi tambah kopi dan hitung voucher
  const tambahPoin = async () => {
    if (!wallet) {
      setStatus("⚠️ Wallet belum terhubung.");
      return;
    }

    try {
      const newCount = count + 1;
      let newVoucher = voucher;

      if (newCount % 5 === 0) {
        newVoucher += 1; // 🎉 Dapat voucher
        setStatus("🎉 Selamat! Kamu dapat 1 voucher!");
      } else {
        setStatus("☕ Ngopi ke-" + newCount);
      }

      const userRef = doc(db, "users", wallet);
      await updateDoc(userRef, { count: newCount, voucher: newVoucher });

      setCount(newCount);
      setVoucher(newVoucher);
    } catch (err) {
      setStatus("❌ Gagal menambah poin: " + err.message);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "25vh" }}>
      <h1>CoffeePoint ☕</h1>
      <p>Poin Ngopi: <strong>{count}</strong></p>
      <p>Voucher: 🎁 <strong>{voucher}</strong></p>
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