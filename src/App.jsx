// src/App.jsx
import { useEffect, useState } from "react";
import { db } from "./firebase";
import { collection, doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";
import { ethers } from "ethers";

function App() {
  const [address, setAddress] = useState(null);
  const [coffeeCount, setCoffeeCount] = useState(0);

  const connectWallet = async () => {
    if (!window.ethereum) return alert("Install Metamask dulu ya!");
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const accounts = await provider.send("eth_requestAccounts", []);
    setAddress(accounts[0]);
  };

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

  const addCoffee = async () => {
    if (!address) return alert("Hubungkan wallet dulu.");
    const userRef = doc(db, "users", address);
    await updateDoc(userRef, { count: increment(1) });
    fetchData(); // update UI
  };

  useEffect(() => {
    if (address) fetchData();

    const testFirebase = async () => {
    try {
      const snap = await getDocs(collection(db, "users"));
      console.log("✅ Terhubung ke Firebase. Jumlah data:", snap.size);
    } catch (err) {
      console.error("❌ Gagal terhubung:", err.message);
    }
  };
  testFirebase();
  }, [address]);

  return (
    <div style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>CoffeePoint ☕</h1>
      {address ? (
        <>
          <p>Wallet: {address}</p>
          <p>Jumlah Ngopi: {coffeeCount}</p>
          <button onClick={addCoffee}>Ngopi Sekali</button>
        </>
      ) : (
        <button onClick={connectWallet}>Connect Wallet</button>
      )}
    </div>
  );
}

export default App;
