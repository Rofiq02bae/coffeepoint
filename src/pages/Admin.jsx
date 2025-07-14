import { useState, useEffect } from "react";
import { db } from "../firebase";
import {
  doc,
  setDoc,
  collection,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";

function Admin() {
  const [tokens, setTokens] = useState([]);
  const [generating, setGenerating] = useState(false);

  const generateToken = async () => {
    try {
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
    } catch (error) {
      console.error("Gagal membuat token:", error);
    } finally {
      setGenerating(false);
    }
  };

  const loadTokens = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, "tokens"));
      const data = querySnapshot.docs.map((doc) => ({
        token: doc.id,
        url: `${window.location.origin}/redeem?token=${doc.id}`,
      }));
      setTokens(data.reverse());
    } catch (error) {
      console.error("Gagal memuat token:", error);
    }
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
          cursor: generating ? "not-allowed" : "pointer",
        }}
      >
        {generating ? "⏳ Membuat..." : "🚀 Generate Token"}
      </button>

      {tokens.length === 0 ? (
        <p>Belum ada token dibuat.</p>
      ) : (
        tokens.map((item, idx) => (
          <div key={item.token} style={{ marginBottom: "30px" }}>
            <p>
              <strong>Token:</strong> <code>{item.token}</code>
            </p>
            <QRCodeSVG value={item.url} size={200} />
            <p>
              <a href={item.url} target="_blank" rel="noreferrer">
                🔗 {item.url}
              </a>
            </p>
            <hr style={{ width: "50%", margin: "2rem auto" }} />
          </div>
        ))
      )}
    </div>
  );
}

export default Admin;
