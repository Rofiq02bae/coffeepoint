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
import './Dashboard.css';


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
        type: "admin"
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
    <div className="dashboard-container">
      <div className="dashboard-header">
        <h1 className="dashboard-title">
          <span className="title-icon">📊</span>
          Dashboard Admin
        </h1>
        <p className="dashboard-subtitle">Kelola token dan pantau aktivitas pengguna</p>
      </div>

      <div className="dashboard-actions">
        <button
          onClick={generateToken}
          disabled={generating}
          className={`generate-btn ${generating ? 'generating' : ''}`}
        >
          <span className="btn-icon">{generating ? "⏳" : "🚀"}</span>
          {generating ? "Membuat Token..." : "Generate Token Baru"}
        </button>
      </div>

      <div className="dashboard-stats">
        <div className="stat-card">
          <div className="stat-number">{tokens.length}</div>
          <div className="stat-label">Total Token</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{users.length}</div>
          <div className="stat-label">Total Pengguna</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{tokens.reduce((acc, token) => acc + token.usedBy, 0)}</div>
          <div className="stat-label">Total Penggunaan</div>
        </div>
      </div>

      <div className="dashboard-section">
        <h2 className="section-title">
          <span className="section-icon">🧾</span>
          Daftar Token
        </h2>
        
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Token ID</th>
                <th>Tanggal Dibuat</th>
                <th>Digunakan</th>
                <th>Link</th>
                <th>QR Code</th>
              </tr>
            </thead>
            <tbody>
              {tokens.map((token) => (
                <tr key={token.id}>
                  <td>
                    <code className="token-id">{token.id.substring(0, 8)}...</code>
                  </td>
                  <td>{token.created}</td>
                  <td>
                    <span className="usage-badge">{token.usedBy}</span>
                  </td>
                  <td>
                    <a 
                      href={`/redeem?token=${token.id}`} 
                      target="_blank" 
                      rel="noreferrer"
                      className="link-btn"
                    >
                      <span>🔗</span> Lihat
                    </a>
                  </td>
                  <td>
                    <div className="qr-container">
                      <div id={`qr-${token.id}`} className="qr-code">
                        <QRCodeSVG 
                          value={`${window.location.origin}/redeem?token=${token.id}`} 
                          size={64} 
                        />
                      </div>
                      <button 
                        onClick={() => downloadQR(token.id)} 
                        className="download-btn"
                        title="Download QR Code"
                      >
                        📥
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {tokens.length === 0 && (
                <tr>
                  <td colSpan="5" className="empty-state">
                    Belum ada token yang dibuat
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="dashboard-section">
        <h2 className="section-title">
          <span className="section-icon">👤</span>
          Daftar Pengguna
        </h2>
        
        <div className="table-container">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Device ID</th>
                <th>Total Poin Kopi</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <code className="device-id">{u.id.substring(0, 12)}...</code>
                  </td>
                  <td>
                    <span className="points-badge">{u.count}</span>
                  </td>
                </tr>
              ))}
              {users.length === 0 && (
                <tr>
                  <td colSpan="2" className="empty-state">
                    Belum ada pengguna terdaftar
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
