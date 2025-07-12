import { useEffect } from "react";
import { db } from "./firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

function App() {
  useEffect(() => {
    const testFirebase = async () => {
      const userRef = doc(db, "users", "contoh@wallet");
      await setDoc(userRef, { count: 1 }); // Menulis data ke Firestore

      const snap = await getDoc(userRef); // Membaca data dari Firestore
      if (snap.exists()) {
        console.log("✅ Data ditemukan:", snap.data());
      } else {
        console.log("❌ Dokumen tidak ditemukan");
      }
    };

    testFirebase();
  }, []);

  return (
    <div>
      <h1>CoffeePoint</h1>
      <p>Testing Firebase Firestore connection</p>
    </div>
  );
}

export default App;