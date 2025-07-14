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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const generateToken = async () => {
    setGenerating(true);
    setError(null);
    try {
      const newToken = crypto.randomUUID();
      const tokenRef = doc(db, "tokens", newToken);
      const fullUrl = `${window.location.origin}/redeem?token=${newToken}`;

      await setDoc(tokenRef, {
        created_at: serverTimestamp(),
        used_by: [],
        type: "admin"
      });

      setTokens((prev) => [
        {
          token: newToken,
          url: fullUrl,
        },
        ...prev,
      ]);
    } catch (error) {
      console.error("Error creating token:", error);
      setError("Gagal membuat token. Silakan coba lagi.");
    } finally {
      setGenerating(false);
    }
  };

  const loadTokens = async () => {
    try {
      setError(null);
      const querySnapshot = await getDocs(collection(db, "tokens"));
      const data = querySnapshot.docs.map((doc) => ({
        token: doc.id,
        url: `${window.location.origin}/redeem?token=${doc.id}`,
        ...doc.data()
      }));
      setTokens(data.reverse());
    } catch (error) {
      console.error("Error loading tokens:", error);
      setError("Gagal memuat token. Silakan coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTokens();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "2rem" }}>
        <h1>🎯 QR Token Generator</h1>
        <p>⏳ Memuat data...</p>
      </div>
    );
  }

  return (
    <div style={{ textAlign: "center", padding: "2rem" }}>
      <h1>🎯 QR Token Generator</h1>

      {error && (
        <div style={{ 
          background: "#ffebee", 
          color: "#c62828", 
          padding: "10px", 
          borderRadius: "4px", 
          marginBottom: "20px",
          border: "1px solid #ef5350"
        }}>
          ⚠️ {error}
          <button 
            onClick={() => {
              setError(null);
              if (!loading) loadTokens();
            }}
            style={{ marginLeft: "10px", fontSize: "12px" }}
          >
            🔄 Coba Lagi
          </button>
        </div>
      )}

      <button
        onClick={generateToken}
        disabled={generating}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          marginBottom: "20px",
          borderRadius: "8px",
          cursor: generating ? "not-allowed" : "pointer",
          background: generating ? "#ccc" : "#2196f3",
          color: "white",
          border: "none"
        }}
      >
        {generating ? "⏳ Membuat..." : "🚀 Generate Token"}
      </button>

      {tokens.length === 0 ? (
        <p style={{ color: "#666" }}>Belum ada token dibuat.</p>
      ) : (
        <div>
          <p style={{ color: "#666", marginBottom: "20px" }}>
            Total token: {tokens.length}
          </p>
          {tokens.map((item, idx) => (
            <div key={item.token} style={{ marginBottom: "30px" }}>
              <p>
                <strong>Token #{idx + 1}:</strong> <code>{item.token}</code>
              </p>
              <QRCodeSVG value={item.url} size={200} />
              <p>
                <a href={item.url} target="_blank" rel="noreferrer">
                  🔗 {item.url}
                </a>
              </p>
              {item.used_by && item.used_by.length > 0 && (
                <p style={{ color: "#f44336", fontSize: "14px" }}>
                  ✅ Sudah digunakan ({item.used_by.length} kali)
                </p>
              )}
              <hr style={{ width: "50%", margin: "2rem auto" }} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default Admin;
