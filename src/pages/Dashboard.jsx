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

  const fetchTokens = async () => {
    const snap = await getDocs(collection(db, "tokens"));
    const data = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        created: d.created_at?.toDate().toLocaleString() || "—",
        usedBy: d.used_by?.length || 0,
      };
    });
    setTokens(data.reverse());
  };

  const fetchUsers = async () => {
    const snap = await getDocs(collection(db, "users"));
    const data = snap.docs.map((doc) => {
      const d = doc.data();
      return {
        id: doc.id,
        count: d.count || 0,
      };
    });
    setUsers(data);
  };

  const generateToken = async () => {
    setGenerating(true);
    try {
      const newToken = crypto.randomUUID();
      const tokenRef = doc(db, "tokens", newToken);
      await setDoc(tokenRef, {
        created_at: serverTimestamp(),
        used_by: [],
      });
      await fetchTokens(); // refresh list
    } catch (e) {
      console.error("Gagal membuat token:", e);
    } finally {
      setGenerating(false);
    }
  };

  const downloadQR = (tokenId) => {
    const qrNode = document.getElementById(`qr-${tokenId}`);
    if (!qrNode) return;
    domtoimage.toPng(qrNode).then((dataUrl) => {
      const link = document.createElement("a");
      link.download = `qr-${tokenId}.png`;
      link.href = dataUrl;
      link.click();
    });
  };
  

  useEffect(() => {
    fetchTokens();
    fetchUsers();
  }, []);

  return (
    <div style={{ padding: "2rem" }}>
      <h1>📊 Dashboard Admin</h1>

      <button
        onClick={generateToken}
        disabled={generating}
        style={{
          padding: "10px 20px",
          fontSize: "16px",
          margin: "20px 0",
          borderRadius: "8px",
          cursor: generating ? "not-allowed" : "pointer",
        }}
      >
        {generating ? "⏳ Membuat..." : "🚀 Generate Token"}
      </button>

      <h2>🧾 Daftar Token</h2>
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px" }}>
        <thead>
          <tr style={{ background: "#eee" }}>
            <th style={cell}>Token</th>
            <th style={cell}>Dibuat</th>
            <th style={cell}>Dipakai</th>
            <th style={cell}>QR</th>
            <th style={cell}>Link</th>
            <th style={cell}>Download</th>
          </tr>
        </thead>
        <tbody>
          {tokens.map((token) => (
            <tr key={token.id}>
              <td style={cell}>{token.id}</td>
              <td style={cell}>{token.created}</td>
              <td style={cell}>{token.usedBy}</td>
              <td style={cell}>
                <QRCodeSVG value={`${window.location.origin}/redeem?token=${token.id}`} size={64} />
              </td>
              <td style={cell}>
                <a href={`/redeem?token=${token.id}`} target="_blank" rel="noreferrer">
                  🔗 Lihat
                </a>
              </td>
              <td style={cell}>
                <div id={`qr-${token.id}`}>
                    <QRCodeSVG value={`${window.location.origin}/redeem?token=${token.id}`} size={64} />
                </div>
                <button onClick={() => downloadQR(token.id)} style={{ marginTop: "5px" }}>
                    🖨 Download
                </button>
                </td>

            </tr>
          ))}
        </tbody>
      </table>

      <h2 style={{ marginTop: "3rem" }}>👤 Daftar User</h2>
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
              <td style={cell}>{u.id}</td>
              <td style={cell}>{u.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const cell = {
  padding: "10px",
  border: "1px solid #ccc",
};

export default Dashboard;
