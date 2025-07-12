import { useEffect, useState } from "react";
import { db } from "./firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";

function App() {
  const [status, setStatus] = useState("Checking Firebase...");

  useEffect(() => {
    const testFirebase = async () => {
      try {
        const ref = doc(db, "users", "contoh@wallet");
        await setDoc(ref, { count: 1 }); // nulis data
        const snap = await getDoc(ref); // baca data
        if (snap.exists()) {
          const data = snap.data();
          setStatus("✅ Firebase connected. Count: " + data.count);
        } else {
          setStatus("⚠️ No data found.");
        }
      } catch (e) {
        setStatus("❌ Firebase error: " + e.message);
      }
    };

    testFirebase();
  }, []);

  return (
    <div style={{ textAlign: "center", marginTop: "30vh" }}>
      <h1>CoffeePoint</h1>
      <p>{status}</p>
    </div>
  );
}

export default App;