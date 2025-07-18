
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
        wallet: d.wallet || null, // Include wallet data
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
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-purple-800 text-white">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 flex items-center justify-center gap-4">
            <span className="text-6xl">📊</span>
            Dashboard Admin
          </h1>
          <p className="text-xl opacity-90 font-light">Kelola token dan pantau aktivitas pengguna</p>
        </div>

        {/* Generate Token Button */}
        <div className="flex justify-center mb-12">
          <button
            onClick={generateToken}
            disabled={generating}
            className={`
              bg-gradient-to-r from-red-500 to-red-600 text-white px-8 py-4 rounded-2xl 
              text-lg font-semibold transition-all duration-300 flex items-center gap-3
              shadow-lg shadow-red-500/30
              ${generating 
                ? 'opacity-70 cursor-not-allowed' 
                : 'hover:-translate-y-1 hover:shadow-xl hover:shadow-red-500/40'
              }
            `}
          >
            <span className="text-xl">{generating ? "⏳" : "🚀"}</span>
            {generating ? "Membuat Token..." : "Generate Token Baru"}
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20 hover:-translate-y-1 transition-all duration-300">
            <div className="text-4xl font-bold mb-2">{tokens.length}</div>
            <div className="text-lg opacity-90 font-light">Total Token</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20 hover:-translate-y-1 transition-all duration-300">
            <div className="text-4xl font-bold mb-2">{users.length}</div>
            <div className="text-lg opacity-90 font-light">Total Pengguna</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20 hover:-translate-y-1 transition-all duration-300">
            <div className="text-4xl font-bold mb-2">{users.reduce((acc, user) => acc + (user.wallet?.balance || 0), 0)}</div>
            <div className="text-lg opacity-90 font-light">Total Points</div>
          </div>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20 hover:-translate-y-1 transition-all duration-300">
            <div className="text-4xl font-bold mb-2">{users.reduce((acc, user) => acc + (user.wallet?.vouchers?.length || 0), 0)}</div>
            <div className="text-lg opacity-90 font-light">Total Vouchers</div>
          </div>
        </div>

        {/* Tokens Section */}
        <div className="mb-12">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">🧾</span>
            Daftar Token
          </h2>
          
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-2xl overflow-x-auto">
            <table className="w-full text-gray-800">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <th className="px-4 py-3 text-left font-semibold text-sm uppercase tracking-wider rounded-l-xl">Token ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-sm uppercase tracking-wider">Tanggal Dibuat</th>
                  <th className="px-4 py-3 text-left font-semibold text-sm uppercase tracking-wider">Digunakan</th>
                  <th className="px-4 py-3 text-left font-semibold text-sm uppercase tracking-wider">Link</th>
                  <th className="px-4 py-3 text-left font-semibold text-sm uppercase tracking-wider rounded-r-xl">QR Code</th>
                </tr>
              </thead>
              <tbody>
                {tokens.map((token) => (
                  <tr key={token.id} className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-4">
                      <code className="bg-gray-100 px-3 py-1 rounded-lg font-mono text-sm text-gray-700">
                        {token.id.substring(0, 8)}...
                      </code>
                    </td>
                    <td className="px-4 py-4 text-gray-700">{token.created}</td>
                    <td className="px-4 py-4">
                      <span className="bg-gradient-to-r from-teal-400 to-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {token.usedBy}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <a 
                        href={`/redeem?token=${token.id}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-4 py-2 rounded-xl font-medium hover:-translate-y-0.5 transition-all duration-300 inline-flex items-center gap-2"
                      >
                        <span>🔗</span> Lihat
                      </a>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-4">
                        <div id={`qr-${token.id}`} className="bg-white p-2 rounded-xl">
                          <QRCodeSVG 
                            value={`${window.location.origin}/redeem?token=${token.id}`} 
                            size={64} 
                          />
                        </div>
                        <button 
                          onClick={() => downloadQR(token.id)} 
                          className="bg-teal-400 hover:bg-teal-500 text-white p-2 rounded-xl transition-all duration-300 hover:scale-110"
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
                    <td colSpan="5" className="px-4 py-12 text-center text-gray-500 italic">
                      Belum ada token yang dibuat
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Users Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-semibold mb-6 flex items-center gap-3">
            <span className="text-2xl">👤</span>
            Daftar Pengguna & Wallet
          </h2>
          
          <div className="bg-white/95 backdrop-blur-lg rounded-2xl p-6 shadow-2xl overflow-x-auto">
            <table className="w-full text-gray-800">
              <thead>
                <tr className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
                  <th className="px-4 py-3 text-left font-semibold text-sm uppercase tracking-wider rounded-l-xl">Device ID</th>
                  <th className="px-4 py-3 text-left font-semibold text-sm uppercase tracking-wider">Wallet Address</th>
                  <th className="px-4 py-3 text-left font-semibold text-sm uppercase tracking-wider">Points Balance</th>
                  <th className="px-4 py-3 text-left font-semibold text-sm uppercase tracking-wider">Vouchers</th>
                  <th className="px-4 py-3 text-left font-semibold text-sm uppercase tracking-wider rounded-r-xl">Legacy Points</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-gray-200 hover:bg-blue-50 transition-colors">
                    <td className="px-4 py-4">
                      <code className="bg-gray-100 px-3 py-1 rounded-lg font-mono text-sm text-gray-700">
                        {u.id.substring(0, 12)}...
                      </code>
                    </td>
                    <td className="px-4 py-4">
                      {u.wallet?.address ? (
                        <code className="bg-green-100 px-3 py-1 rounded-lg font-mono text-xs text-green-700">
                          {u.wallet.address.substring(0, 8)}...{u.wallet.address.substring(-4)}
                        </code>
                      ) : (
                        <span className="text-gray-400 italic">No wallet</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <span className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-1 w-fit">
                        💰 {u.wallet?.balance || 0}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="bg-gradient-to-r from-purple-400 to-pink-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                          🎟️ {u.wallet?.vouchers?.length || 0}
                        </span>
                        {u.wallet?.vouchers?.length > 0 && (
                          <div className="text-xs text-gray-600">
                            Used: {u.wallet.vouchers.filter(v => v.used).length}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className="bg-gradient-to-r from-teal-400 to-green-500 text-white px-3 py-1 rounded-full text-sm font-semibold">
                        {u.count}
                      </span>
                    </td>
                  </tr>
                ))}
                {users.length === 0 && (
                  <tr>
                    <td colSpan="5" className="px-4 py-12 text-center text-gray-500 italic">
                      Belum ada pengguna terdaftar
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
