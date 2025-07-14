import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  doc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { QRCode } from "qrcode.react";

function Admin() {
  const [tokens, setTokens] = useState([]);
  const [generating, setGenerating] = useState(false);

  const generateToken = async () => {
    setGenerating(true);
    const newToken = crypto.randomUUID();
    const tokenRef = doc(db, "tokens", newToken);
    const fullUrl = `${window.location.origin}/redeem?token=${newToken}`;

    await setDoc(tokenRef, {
      created_at: serverTimestamp(),
      used_by: [],
    });

    setTokens((prev) => [
      {
        token: newToken,
        url: fullUrl,
      },
      ...prev,
    ]);

    setGenerating(false);
  };

  const loadTokens = async () => {
    const querySnapshot = await getDocs(collection(db, "tokens"));
    const data = [];
    querySnapshot.forEach((doc) => {
      data.push({
        token: doc.id,
        url: `${window.location.origin}/redeem?token=${doc.id}`,
      });
    });
    setTokens(data.reverse());
  };

  useEffect(() => {
    loadTokens();
  }, []);

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>🎯 QR Token Generator</h1>
      <button
        onClick={generateToken}
        disabled={generating}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          marginBottom: "20px",
          borderRadius: "8px",
        }}
      >
        {generating ? "⏳ Membuat..." : "🚀 Generate Token"}
      </button>

      {tokens.length === 0 && <p>Belum ada token dibuat.</p>}

      {tokens.map((item, idx) => (
        <div key={idx} style={{ marginBottom: "30px" }}>
          <p>
            <strong>Token:</strong> <code>{item.token}</code>
          </p>
          <QRCode value={item.url} size={200} />
          <p>
            <a href={item.url} target="_blank" rel="noreferrer">
              🔗 {item.url}
            </a>
          </p>
          <hr style={{ width: "50%", margin: "2rem auto" }} />
        </div>
      ))}
    </div>
  );
}

export default Admin;
