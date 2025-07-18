import { useEffect, useState } from "react";
import { db } from "../firebase";
import {
  doc,
  getDoc,
  updateDoc,
  setDoc,
  arrayUnion,
  increment
} from "firebase/firestore";
import { useSearchParams, useNavigate } from "react-router-dom";

function Redeem() {
  const [status, setStatus] = useState("⏳ Memproses...");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");
  const [deviceId, setDeviceId] = useState(null);
  const [countdown, setCountdown] = useState(null);
  const [isProcessed, setIsProcessed] = useState(false);

  useEffect(() => {
    let id = localStorage.getItem("deviceId");
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem("deviceId", id);
    }
    setDeviceId(id);
  }, []);

  useEffect(() => {
    if (token && deviceId) handleRedeem();
  }, [token, deviceId]);

  // Auto-redirect countdown timer
  useEffect(() => {
    if (isProcessed && countdown === null) {
      setCountdown(5);
    }
  }, [isProcessed, countdown]);

  useEffect(() => {
    if (countdown !== null && countdown > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0) {
      navigate('/user');
    }
  }, [countdown, navigate]);

  const handleRedeem = async () => {
    try {
      const tokenRef = doc(db, "tokens", token);
      const snap = await getDoc(tokenRef);

      if (!snap.exists()) {
        setStatus("❌ Token tidak valid.");
        setIsProcessed(true);
        return;
      }

      const data = snap.data();
      const alreadyUsed = (data.used_by || []).includes(deviceId);

      if (alreadyUsed) {
        setStatus("⚠️ Voucher sudah pernah digunakan oleh perangkat ini.");
        setIsProcessed(true);
        return;
      }

      if ((data.used_by || []).length > 0) {
        setStatus("❌ Voucher ini sudah digunakan.");
        setIsProcessed(true);
        return;
      }

      // tandai token sebagai digunakan
      await updateDoc(tokenRef, {
        used_by: arrayUnion(deviceId),
      });

      // tambah poin user dan update wallet
      const userRef = doc(db, "users", deviceId);
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        const userData = userSnap.data();
        const currentWallet = userData.wallet || { balance: 0, vouchers: [] };
        
        // Update wallet balance
        await updateDoc(userRef, {
          count: increment(1),
          'wallet.balance': increment(1)
        });
      } else {
        // Create new user with wallet
        const newWallet = {
          address: crypto.randomUUID(),
          balance: 1,
          vouchers: []
        };
        
        await setDoc(userRef, {
          count: 1,
          wallet: newWallet
        });
      }

      setStatus("✅ Voucher berhasil digunakan! +1 poin.");
      setIsProcessed(true);
    } catch (e) {
      console.error(e);
      setStatus("❌ Terjadi kesalahan saat memproses token.");
      setIsProcessed(true);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-coffee-400 to-coffee-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
        <div className="mb-6">
          <div className="text-6xl mb-4">🎟️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Penukaran Voucher</h1>
        </div>
        
        <div className="mb-6">
          <p className="text-lg text-gray-700">{status}</p>
        </div>
        
        {isProcessed && countdown !== null && (
          <div className="bg-gray-50 rounded-2xl p-6 mb-6">
            <div className="text-4xl mb-2">⏰</div>
            <p className="text-gray-600 mb-2">Kembali ke dashboard dalam:</p>
            <div className="text-3xl font-bold text-coffee-600">{countdown}</div>
            <p className="text-sm text-gray-500 mt-2">detik</p>
            
            <button
              onClick={() => navigate('/user')}
              className="mt-4 bg-coffee-500 hover:bg-coffee-600 text-white px-6 py-2 rounded-xl transition-colors duration-200"
            >
              Kembali Sekarang
            </button>
          </div>
        )}
        
        {!isProcessed && (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coffee-600"></div>
            <span className="ml-3 text-gray-600">Memproses...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default Redeem;
