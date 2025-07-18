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
  collection,
} from "firebase/firestore";
import { QRCodeSVG } from "qrcode.react";
import WalletInfo from "../components/WalletInfo";
import VoucherList from "../components/VoucherList";
import RedeemVoucher from "../components/RedeemVoucher";

const REDEEM_THRESHOLD = 5;


function UserDashboard() {
  const [deviceId, setDeviceId] = useState(null);
  const [count, setCount] = useState(0);
  const [wallet, setWallet] = useState(null);
  const [voucher, setVoucher] = useState(null);
  const [vouchers, setVouchers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Generate wallet address
  const generateWalletAddress = () => {
    return '0x' + crypto.randomUUID().replace(/-/g, '').substring(0, 40);
  };

  // Show notification
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // Initialize wallet if doesn't exist
  const initializeWallet = async (userId) => {
    const userRef = doc(db, "users", userId);
    const userSnap = await getDoc(userRef);
    
    if (userSnap.exists()) {
      const userData = userSnap.data();
      if (!userData.wallet) {
        // Create new wallet
        const newWallet = {
          address: generateWalletAddress(),
          balance: 0,
          vouchers: []
        };
        
        await updateDoc(userRef, {
          wallet: newWallet
        });
        
        setWallet(newWallet);
        showNotification("🎉 New wallet created! Start collecting points by scanning QR codes.");
      } else {
        setWallet(userData.wallet);
      }
      setCount(userData.count || 0);
    } else {
      // Create new user with wallet
      const newWallet = {
        address: generateWalletAddress(),
        balance: 0,
        vouchers: []
      };
      
      await setDoc(userRef, { 
        count: 0,
        wallet: newWallet 
      });
      
      setWallet(newWallet);
      setCount(0);
      showNotification("🎉 Welcome! Your wallet has been created.");
    }
  };

  // Fetch user data
  const fetchUserData = async (id) => {
    if (!id) return;
    const userRef = doc(db, "users", id);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const userData = snap.data();
      setCount(userData.count || 0);
      setWallet(userData.wallet || null);
    } else {
      await initializeWallet(id);
    }
  };

  // Fetch vouchers
  const fetchVouchers = async (id) => {
    if (!id) return;
    const userRef = doc(db, "users", id);
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      const userData = snap.data();
      setVouchers(userData.wallet?.vouchers || []);
    }
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
    if ((wallet?.balance || 0) < REDEEM_THRESHOLD) {
      showNotification("❌ Not enough points! You need 5 points to redeem a voucher.", 'error');
      return;
    }
    
    setLoading(true);
    try {
      const userRef = doc(db, "users", deviceId);
      const voucherId = crypto.randomUUID();
      
      // Create new voucher object
      const newVoucher = {
        id: voucherId,
        created_at: serverTimestamp(),
        used: false
      };
      
      // Update user wallet
      const updatedVouchers = [...(wallet.vouchers || []), newVoucher];
      const updatedWallet = {
        ...wallet,
        balance: wallet.balance - REDEEM_THRESHOLD,
        vouchers: updatedVouchers
      };
      
      await updateDoc(userRef, {
        wallet: updatedWallet
      });
      
      // Update local state
      setWallet(updatedWallet);
      setVouchers(updatedVouchers);
      
      // Show success voucher modal
      setVoucher({
        id: voucherId,
        url: `${window.location.origin}/redeem?token=${voucherId}`,
      });
      
      showNotification("🎉 Voucher created successfully! -5 points", 'success');
    } catch (e) {
      console.error("Failed to redeem voucher:", e);
      showNotification("❌ Failed to create voucher. Please try again.", 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-400 via-red-500 to-pink-600 text-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Notification */}
        {notification && (
          <div className={`
            fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg transition-all duration-300
            ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}
          `}>
            {notification.message}
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-4 animate-bounce-slow">☕</div>
          <h1 className="text-5xl font-bold mb-2 drop-shadow-lg">Coffee Point</h1>
          <p className="text-xl opacity-90 font-light">Web3-like Loyalty System</p>
        </div>

        {/* Wallet Info */}
        <WalletInfo wallet={wallet} deviceId={deviceId} />

        {/* Redeem Voucher */}
        <RedeemVoucher 
          wallet={wallet} 
          onRedeem={redeem}
          loading={loading}
        />

        {/* Voucher List */}
        <VoucherList 
          vouchers={vouchers}
          onUseVoucher={(voucherId) => {
            // Handle voucher usage
            window.open(`/redeem?token=${voucherId}`, '_blank');
          }}
        />

        {/* Success Modal */}
        {voucher && (
          <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div className="bg-white text-gray-800 rounded-2xl p-8 max-w-md w-full animate-modal-appear">
              <div className="text-center">
                <div className="text-6xl mb-4 animate-celebration">🎉</div>
                <h3 className="text-2xl font-bold mb-2">Voucher Created!</h3>
                <p className="text-gray-600 mb-6">Your new voucher is ready to use</p>
                
                <div className="bg-gray-100 rounded-xl p-4 mb-6">
                  <QRCodeSVG value={voucher.url} size={200} className="mx-auto" />
                </div>
                
                <div className="flex gap-3">
                  <a 
                    href={voucher.url} 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-700 transition-all duration-300"
                  >
                    🔗 Open Link
                  </a>
                  <button 
                    onClick={() => setVoucher(null)}
                    className="flex-1 bg-gray-200 text-gray-800 py-3 px-6 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Legacy Points Info */}
        {count > 0 && (
          <div className="mt-8 bg-yellow-500/20 backdrop-blur-lg rounded-2xl p-6 border border-yellow-500/30">
            <h3 className="text-xl font-semibold mb-4 flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              Legacy Points System
            </h3>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-yellow-100">You have legacy points from the old system</p>
                <p className="text-yellow-200 text-sm">These will be migrated to your wallet soon</p>
              </div>
              <div className="text-2xl font-bold text-yellow-300">
                {count} points
              </div>
            </div>
          </div>
        )}

        {/* Info Section */}
        <div className="mt-8 bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-white/20">
          <h4 className="text-xl font-semibold mb-4 flex items-center gap-2">
            💡 How it works
          </h4>
          <ul className="space-y-2 text-white/90">
            <li className="flex items-start gap-3">
              <span className="text-green-400">•</span>
              Scan QR codes from receipts to earn points in your wallet
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400">•</span>
              Collect 5 points to redeem 1 coffee voucher (NFT-like)
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400">•</span>
              Each voucher has a unique ID and can only be used once
            </li>
            <li className="flex items-start gap-3">
              <span className="text-green-400">•</span>
              Show QR code to barista to redeem your free coffee
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}

export default UserDashboard;
