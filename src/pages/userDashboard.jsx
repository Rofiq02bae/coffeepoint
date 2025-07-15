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
import './UserDashboard.css';

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
    <div className="user-dashboard-container">
      <div className="user-header">
        <div className="coffee-animation">☕</div>
        <h1 className="user-title">Coffee Point</h1>
        <p className="user-subtitle">Kumpulkan poin dan dapatkan kopi gratis!</p>
      </div>

      <div className="points-section">
        <div className="points-card">
          <div className="points-icon">🏆</div>
          <div className="points-info">
            <h2 className="points-title">Poin Kamu</h2>
            <div className="points-value">{count}</div>
            <div className="points-progress">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{ width: `${Math.min((count / REDEEM_THRESHOLD) * 100, 100)}%` }}
                ></div>
              </div>
              <p className="progress-text">
                {count >= REDEEM_THRESHOLD 
                  ? "Siap ditukar!" 
                  : `${REDEEM_THRESHOLD - count} poin lagi untuk voucher`
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="action-section">
        <button
          onClick={redeem}
          disabled={count < REDEEM_THRESHOLD}
          className={`redeem-btn ${count >= REDEEM_THRESHOLD ? 'ready' : 'disabled'}`}
        >
          <span className="btn-icon">🎁</span>
          <span className="btn-text">
            {count >= REDEEM_THRESHOLD ? 'Tukar Voucher Sekarang' : 'Butuh Lebih Banyak Poin'}
          </span>
        </button>
      </div>

      {voucher && (
        <div className="voucher-modal">
          <div className="voucher-content">
            <div className="success-animation">🎉</div>
            <h3 className="voucher-title">Selamat! Voucher Berhasil Dibuat</h3>
            <p className="voucher-description">Tunjukkan QR code ini kepada barista</p>
            
            <div className="voucher-qr">
              <QRCodeSVG value={voucher.url} size={200} />
            </div>
            
            <div className="voucher-actions">
              <a 
                href={voucher.url} 
                target="_blank" 
                rel="noreferrer"
                className="voucher-link"
              >
                🔗 Buka di Tab Baru
              </a>
              <button 
                onClick={() => setVoucher(null)}
                className="close-btn"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="vouchers-section">
        <h3 className="section-title">
          <span className="section-icon">🎟️</span>
          Voucher Aktif ({vouchers.length})
        </h3>
        
        {vouchers.length > 0 ? (
          <div className="vouchers-grid">
            {vouchers.map((v) => (
              <div key={v.id} className="voucher-card">
                <div className="voucher-header">
                  <span className="voucher-status">Aktif</span>
                  <span className="voucher-date">
                    {v.created_at?.toDate().toLocaleDateString() || 'Hari ini'}
                  </span>
                </div>
                
                <div className="voucher-qr-container">
                  <QRCodeSVG 
                    value={`${window.location.origin}/redeem?token=${v.id}`} 
                    size={120} 
                  />
                </div>
                
                <div className="voucher-actions">
                  <a 
                    href={`/redeem?token=${v.id}`} 
                    target="_blank"
                    rel="noreferrer"
                    className="use-voucher-btn"
                  >
                    Gunakan Voucher
                  </a>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-vouchers">
            <div className="empty-icon">📭</div>
            <p>Belum ada voucher aktif</p>
            <small>Kumpulkan {REDEEM_THRESHOLD} poin untuk mendapatkan voucher pertama!</small>
          </div>
        )}
      </div>

      <div className="info-section">
        <div className="info-card">
          <h4>💡 Tips</h4>
          <ul>
            <li>Setiap pembelian kopi = 1 poin</li>
            <li>Kumpulkan {REDEEM_THRESHOLD} poin untuk 1 voucher kopi gratis</li>
            <li>Voucher tidak memiliki tanggal kedaluwarsa</li>
            <li>Tunjukkan QR code kepada barista untuk menukar voucher</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
