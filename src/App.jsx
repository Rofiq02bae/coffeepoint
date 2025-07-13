import { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  increment,
} from "firebase/firestore";
import { ethers } from "ethers";

function App() {
  const [address, setAddress] = useState(null);
  const [coffeeCount, setCoffeeCount] = useState(0);
  const [status, setStatus] = useState("🔄 Memuat...");
  
  // Hubungkan Wallet
  const connectWallet = async () => {
    if (!window.ethereum) return alert("Install Metamask dulu ya!");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    setAddress(accounts[0]);
    setStatus(`✅ Wallet: ${accounts[0].slice(0, 6)}...${accounts[0].slice(-4)}`);
  };

  // Ambil data poin user
  const fetchData = async () => {
    if (!address) return;
    const userRef = doc(db, "users", address);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      setCoffeeCount(userSnap.data().count || 0);
    } else {
      await setDoc(userRef, { count: 0 });
      setCoffeeCount(0);
    }
  };

  // Tambah poin kopi
  const addCoffee = async () => {
    if (!address) return alert("Hubungkan wallet dulu.");
    const userRef = doc(db, "users", address);
    await updateDoc(userRef, { count: increment(1) });
    setStatus("☕ Poin berhasil ditambah!");
    fetchData();
  };

  // Jalankan saat wallet terhubung
  useEffect(() => {
    if (address) {
      fetchData();
    }
  }, [address]);

  // Cek koneksi Firebase saat awal
  useEffect(() => {
    const cekFirebase = async () => {
      try {
        const snap = await getDocs(collection(db, "users"));
        console.log("✅ Terhubung ke Firebase. Jumlah data:", snap.size);
      } catch (err) {
        console.error("❌ Gagal terhubung ke Firebase:", err.message);
      }
    };
    cekFirebase();
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "25vh" }}>
      <h1>CoffeePoint ☕</h1>
      {address ? (
        <>
          <p><strong>Poin:</strong> {coffeeCount}</p>
          <button
            onClick={addCoffee}
            style={{
              padding: "10px 20px",
              fontSize: "16px",
              marginTop: "10px",
              borderRadius: "8px",
            }}
          >
            ➕ Tambah Poin Ngopi
          </button>
        </>
      ) : (
        <button
          onClick={connectWallet}
          style={{
            padding: "10px 20px",
            fontSize: "16px",
            marginTop: "10px",
            borderRadius: "8px",
          }}
        >
          🔐 Hubungkan Wallet
        </button>
      )}
      <p style={{ marginTop: "20px", color: "#555" }}>{status}</p>
    </div>
  );
}

export default App;
