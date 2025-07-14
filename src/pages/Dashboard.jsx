import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  collection,
  getDocs,
  doc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import domtoimage from "dom-to-image";

function Dashboard() {
  const [tokens, setTokens] = useState([]);
  const [users, setUsers] = useState([]);
  const [generating, setGenerating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTokens = async () => {
    try {
      setError(null);
      const snap = await getDocs(collection(db, "tokens"));
      const data = snap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          created: d.created_at?.toDate().toLocaleString() || "—",
          usedBy: d.used_by?.length || 0,
          type: d.type || "admin"
        };
      });
      setTokens(data.reverse());
    } catch (error) {
      console.error("Error fetching tokens:", error);
      setError("Gagal memuat token. Silakan coba lagi.");
    }
  };

  const fetchUsers = async () => {
    try {
      setError(null);
      const snap = await getDocs(collection(db, "users"));
      const data = snap.docs.map((doc) => {
        const d = doc.data();
        return {
          id: doc.id,
          count: d.count || 0,
        };
      });
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
      setError("Gagal memuat data pengguna. Silakan coba lagi.");
    }
  };

  const generateToken = async () => {
    setGenerating(true);
    setError(null);
    try {
      const newToken = crypto.randomUUID();
      const tokenRef = doc(db, "tokens", newToken);
      await setDoc(tokenRef, {
        created_at: serverTimestamp(),
        used_by: [],
        type: "admin"
      });
      await fetchTokens(); // refresh list
    } catch (error) {
      console.error("Error generating token:", error);
      setError("Gagal membuat token. Silakan coba lagi.");
    } finally {
      setGenerating(false);
    }
  };

  const downloadQR = async (tokenId) => {
    try {
      const qrNode = document.getElementById(`qr-${tokenId}`);
      if (!qrNode) {
        throw new Error("QR code element not found");
      }
      const dataUrl = await domtoimage.toPng(qrNode);
      const link = document.createElement("a");
      link.download = `qr-${tokenId}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error("Error downloading QR:", error);
      alert("Gagal mengunduh QR code. Silakan coba lagi.");
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchTokens(), fetchUsers()]);
      setLoading(false);
    };
    loadData();
  }, []);

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <h1>📊 Dashboard Admin</h1>
        <p>⏳ Memuat data...</p>
      </div>
    );
  }

  return (
    <div style={{ padding: "2rem" }}>
      <h1>📊 Dashboard Admin</h1>

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
              fetchTokens();
              fetchUsers();
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
          margin: "20px 0",
          borderRadius: "8px",
          cursor: generating ? "not-allowed" : "pointer",
          background: generating ? "#ccc" : "#2196f3",
          color: "white",
          border: "none"
        }}
      >
        {generating ? "⏳ Membuat..." : "🚀 Generate Token"}
      </button>

      <h2>🧾 Daftar Token ({tokens.length})</h2>
      {tokens.length === 0 ? (
        <p style={{ color: "#666" }}>Belum ada token yang dibuat.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
            <thead>
              <tr style={{ background: "#eee" }}>
                <th style={cell}>Token</th>
                <th style={cell}>Tipe</th>
                <th style={cell}>Dibuat</th>
                <th style={cell}>Dipakai</th>
                <th style={cell}>Link</th>
                <th style={cell}>QR & Download</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token) => (
                <tr key={token.id}>
                  <td style={cell}>{token.id.substring(0, 8)}...</td>
                  <td style={cell}>{token.type}</td>
                  <td style={cell}>{token.created}</td>
                  <td style={cell}>{token.usedBy}</td>
                  <td style={cell}>
                    <a href={`/redeem?token=${token.id}`} target="_blank" rel="noreferrer">
                      🔗 Lihat
                    </a>
                  </td>
                  <td style={cell}>
                    <div id={`qr-${token.id}`}>
                        <QRCodeSVG value={`${window.location.origin}/redeem?token=${token.id}`} size={64} />
                    </div>
                    <button 
                      onClick={() => downloadQR(token.id)} 
                      style={{ marginTop: "5px", fontSize: "12px" }}
                    >
                        🖨 Download
                    </button>
                    </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 style={{ marginTop: "3rem" }}>👤 Daftar User ({users.length})</h2>
      {users.length === 0 ? (
        <p style={{ color: "#666" }}>Belum ada user yang terdaftar.</p>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
            <thead>
              <tr style={{ background: "#eee" }}>
                <th style={cell}>Device ID</th>
                <th style={cell}>Total Kopi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td style={cell}>{u.id.substring(0, 8)}...</td>
                  <td style={cell}>{u.count}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

const cell = {
  padding: "10px",
  border: "1px solid #ccc",
};

export default Dashboard;
