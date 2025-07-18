import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
  increment,
  getDocs,
  collection, // PERLU DITAMBAH
} from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";

const REDEEM_THRESHOLD = 5;


function UserDashboard() {
  const [deviceId, setDeviceId] = useState(null);
  const [count, setCount] = useState(0);
  const [voucher, setVoucher] = useState(null);
  const [vouchers, setVouchers] = useState([]);

  // Fetch user data
  const fetchUserData = async (id) => {
    if (!id) return;
    const userRef = doc(db, "users", id);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      setCount(snap.data().count || 0);
    } else {
      await setDoc(userRef, { count: 0 });
      setCount(0);
    }
  };

  // Fetch vouchers
  const fetchVouchers = async (id) => {
    if (!id) return;
    const snap = await getDocs(collection(db, "tokens"));
    const voucherList = snap.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((item) => item.type === "voucher" && item.from_user === id && (item.used_by?.length ?? 0) === 0);
    setVouchers(voucherList);
  };

  // Ambil ID device dari localStorage
  useEffect(() => {
    let id = localStorage.getItem("deviceId");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("deviceId", id);
    }
    setDeviceId(id);
  }, []);

  useEffect(() => {
    if (deviceId) {
      fetchUserData(deviceId);
      fetchVouchers(deviceId);
    }
  }, [deviceId]);

  const redeem = async () => {
    if (count < REDEEM_THRESHOLD) return alert("Poin belum cukup!");
    try {
      const userRef = doc(db, "users", deviceId);
      const tokenId = crypto.randomUUID();
      const tokenRef = doc(db, "tokens", tokenId);
      // 1. Kurangi poin
      await updateDoc(userRef, {
        count: increment(-REDEEM_THRESHOLD),
      });
      // 2. Buat token baru
      await setDoc(tokenRef, {
        created_at: serverTimestamp(),
        used_by: [],
        type: "voucher",
        from_user: deviceId,
      });
      setVoucher({
        id: tokenId,
        url: `${window.location.origin}/redeem?token=${tokenId}`,
      });
      // Refresh count & vouchers
      fetchUserData(deviceId);
      fetchVouchers(deviceId);
    } catch (e) {
      console.error("Gagal tukar voucher:", e);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-pink-500 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bounce-slow">☕</div>
          <h1 className="text-4xl font-bold mb-2 drop-shadow-lg">Coffee Point</h1>
          <p className="text-lg opacity-90 font-light">Kumpulkan poin dan dapatkan kopi gratis!</p>
        </div>

        {/* Points Section */}
        <div className="mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 border border-white/20 shadow-2xl">
            <div className="flex items-center gap-6 flex-col md:flex-row text-center md:text-left">
              <div className="text-5xl animate-pulse-slow">🏆</div>
              <div className="flex-1">
                <h2 className="text-xl font-semibold mb-2 opacity-90">Poin Kamu</h2>
                <div className="text-5xl font-bold mb-4 drop-shadow-lg">{count}</div>
                <div className="space-y-2">
                  <div className="w-full h-3 bg-white/20 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-teal-400 to-green-500 rounded-full transition-all duration-500 relative"
                      style={{ width: `${Math.min((count / REDEEM_THRESHOLD) * 100, 100)}%` }}
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                    </div>
                  </div>
                  <p className="text-sm opacity-90 text-center">
                    {count >= REDEEM_THRESHOLD 
                      ? "Siap ditukar!" 
                      : `${REDEEM_THRESHOLD - count} poin lagi untuk voucher`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="text-center mb-12">
          <button
            onClick={redeem}
            disabled={count < REDEEM_THRESHOLD}
            className={`
              px-10 py-4 rounded-full text-lg font-semibold transition-all duration-300 
              flex items-center gap-3 mx-auto min-w-[280px] justify-center
              ${count >= REDEEM_THRESHOLD 
                ? 'bg-gradient-to-r from-teal-400 to-green-500 hover:-translate-y-1 hover:shadow-xl shadow-teal-400/30' 
                : 'bg-white/20 cursor-not-allowed'
              }
            `}
          >
            <span className="text-xl">🎁</span>
            <span>
              {count >= REDEEM_THRESHOLD ? 'Tukar Voucher Sekarang' : 'Butuh Lebih Banyak Poin'}
            </span>
          </button>
        </div>

        {/* Voucher Modal */}
        {voucher && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white text-gray-800 rounded-3xl p-8 max-w-md w-full animate-modal-appear">
              <div className="text-center">
                <div className="text-5xl mb-4 animate-celebration">🎉</div>
                <h3 className="text-2xl font-bold mb-2">Selamat! Voucher Berhasil Dibuat</h3>
                <p className="text-gray-600 mb-6">Tunjukkan QR code ini kepada barista</p>
                
                <div className="bg-white p-4 rounded-2xl inline-block mb-6 shadow-lg">
                  <QRCodeSVG value={voucher.url} size={200} />
                </div>
                
                <div className="flex gap-3 justify-center flex-wrap">
                  <a 
                    href={voucher.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-6 py-3 rounded-xl font-medium hover:-translate-y-0.5 transition-all duration-300"
                  >
                    🔗 Buka di Tab Baru
                  </a>
                  <button 
                    onClick={() => setVoucher(null)}
                    className="bg-red-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-red-600 hover:-translate-y-0.5 transition-all duration-300"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Active Vouchers */}
        <div className="mb-8">
          <h3 className="text-2xl font-semibold mb-6 flex items-center gap-2 justify-center">
            <span className="text-xl">🎟️</span>
            Voucher Aktif ({vouchers.length})
          </h3>
          
          {vouchers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {vouchers.map((v) => (
                <div key={v.id} className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20 hover:-translate-y-1 transition-all duration-300">
                  <div className="flex justify-between items-center mb-4">
                    <span className="bg-teal-400 text-white px-3 py-1 rounded-full text-sm font-semibold">
                      Aktif
                    </span>
                    <span className="text-sm opacity-80">
                      {v.created_at?.toDate().toLocaleDateString() || 'Hari ini'}
                    </span>
                  </div>
                  
                  <div className="bg-white p-3 rounded-xl text-center mb-4">
                    <QRCodeSVG 
                      value={`${window.location.origin}/redeem?token=${v.id}`} 
                      size={120} 
                    />
                  </div>
                  
                  <div className="text-center">
                    <a 
                      href={`/redeem?token=${v.id}`} 
                      target="_blank"
                      rel="noreferrer"
                      className="bg-gradient-to-r from-red-400 to-red-600 text-white px-6 py-3 rounded-full font-semibold hover:-translate-y-0.5 transition-all duration-300 inline-block"
                    >
                      Gunakan Voucher
                    </a>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/10 backdrop-blur-lg rounded-2xl border border-white/20">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-lg font-medium mb-2">Belum ada voucher aktif</p>
              <small className="opacity-80">Kumpulkan {REDEEM_THRESHOLD} poin untuk mendapatkan voucher pertama!</small>
            </div>
          )}
        </div>

        {/* Info Section */}
        <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
            💡 Tips
          </h4>
          <ul className="space-y-2 text-left opacity-90 leading-relaxed">
            <li>• Setiap pembelian kopi = 1 poin</li>
            <li>• Kumpulkan {REDEEM_THRESHOLD} poin untuk 1 voucher kopi gratis</li>
            <li>• Voucher tidak memiliki tanggal kedaluwarsa</li>
            <li>• Tunjukkan QR code kepada barista untuk menukar voucher</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
