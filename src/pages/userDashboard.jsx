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
  const initializeWallet = async (id) => {
    if (!id) return;
    
    try {
      console.log("Initializing wallet for user:", id);
      const userRef = doc(db, "users", id);
      
      const newWallet = {
        address: crypto.randomUUID(),
        balance: 1, // Start with 1 point from first scan
        vouchers: []
      };
      
      await setDoc(userRef, { 
        count: 1,
        wallet: newWallet 
      });
      
      setWallet(newWallet);
      setCount(1);
      console.log("Wallet initialized successfully:", newWallet);
      showNotification("🎉 Welcome! Your wallet has been created with +1 point.", 'success');
    } catch (error) {
      console.error("Failed to initialize wallet:", error);
      showNotification("❌ Failed to create wallet", 'error');
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

  // Simulate QR scan (for testing)
  const simulateQRScan = async () => {
    console.log("Starting QR scan simulation...");
    setLoading(true);
    try {
      const userRef = doc(db, "users", deviceId);
      console.log("Getting user document...");
      const userSnap = await getDoc(userRef);
      
      if (userSnap.exists()) {
        console.log("User exists, updating balance...");
        const userData = userSnap.data();
        console.log("Current user data:", userData);
        
        // Update wallet balance
        await updateDoc(userRef, {
          count: increment(1),
          'wallet.balance': increment(1)
        });
        console.log("Balance updated successfully");
        
        // Refresh data
        await fetchUserData(deviceId);
        showNotification("🎉 +1 point added to your wallet!", 'success');
      } else {
        console.log("User doesn't exist, creating new user...");
        await initializeWallet(deviceId);
        showNotification("🎉 Welcome! +1 point added to your new wallet!", 'success');
      }
    } catch (error) {
      console.error("Error simulating QR scan:", error);
      console.error("Error details:", error.message);
      console.error("Error code:", error.code);
      showNotification("❌ Failed to process QR scan", 'error');
    } finally {
      setLoading(false);
      console.log("QR scan simulation finished");
    }
  };

  const redeem = async () => {
    console.log("Starting redeem process...");
    console.log("Wallet:", wallet);
    console.log("DeviceId:", deviceId);
    
    if ((wallet?.balance || 0) < REDEEM_THRESHOLD) {
      console.log("Not enough balance:", wallet?.balance);
      showNotification("❌ Not enough points! You need 5 points to redeem a voucher.", 'error');
      return;
    }
    
    setLoading(true);
    try {
      console.log("Creating voucher...");
      const voucherId = crypto.randomUUID();
      console.log("Generated voucher ID:", voucherId);
      
      // Create new voucher object for wallet
      const newVoucher = {
        id: voucherId,
        created_at: new Date().toISOString(), // Use ISO string instead of serverTimestamp
        used: false
      };
      console.log("New voucher object:", newVoucher);
      
      // Try to create token in tokens collection first
      const tokenRef = doc(db, "tokens", voucherId);
      console.log("Creating token in Firestore...");
      
      try {
        await setDoc(tokenRef, {
          created_at: new Date().toISOString(), // Use ISO string
          used_by: [],
          type: "voucher",
          from_user: deviceId
        });
        console.log("Token created successfully");
      } catch (tokenError) {
        console.error("Failed to create token, but continuing:", tokenError);
        // Continue even if token creation fails
      }
      
      // Update user wallet
      const updatedVouchers = [...(wallet.vouchers || []), newVoucher];
      const updatedWallet = {
        ...wallet,
        balance: wallet.balance - REDEEM_THRESHOLD,
        vouchers: updatedVouchers
      };
      console.log("Updated wallet:", updatedWallet);
      
      console.log("Updating user document...");
      const userRef = doc(db, "users", deviceId);
      
      try {
        await updateDoc(userRef, {
          wallet: updatedWallet
        });
        console.log("User document updated successfully");
      } catch (updateError) {
        console.error("Failed to update user document, trying setDoc:", updateError);
        // Fallback: try to set the entire document
        await setDoc(userRef, {
          count: wallet.balance - REDEEM_THRESHOLD,
          wallet: updatedWallet
        }, { merge: true });
        console.log("User document set successfully with merge");
      }
      
      // Update local state
      setWallet(updatedWallet);
      setVouchers(updatedVouchers);
      
      // Show success voucher modal
      setVoucher({
        id: voucherId,
        url: `${window.location.origin}/redeem?token=${voucherId}`,
      });
      
      console.log("Voucher creation completed successfully");
      showNotification("🎉 Voucher created successfully! -5 points", 'success');
    } catch (e) {
      console.error("Failed to redeem voucher:", e);
      console.error("Error details:", e.message);
      console.error("Error code:", e.code);
      showNotification("❌ Failed to create voucher. Please try again.", 'error');
    } finally {
      setLoading(false);
      console.log("Redeem process finished");
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

        {/* QR Scan Simulation (for testing) */}
        <div className="mb-6 text-center">
          <button
            onClick={simulateQRScan}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-6 py-3 rounded-xl font-semibold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-1 disabled:transform-none"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Processing...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                📱 Simulate QR Scan (+1 Point)
              </span>
            )}
          </button>
          <p className="text-sm opacity-75 mt-2">Click to simulate scanning a receipt QR code</p>
        </div>

        {/* Wallet Info */}
        <WalletInfo wallet={wallet} deviceId={deviceId} notification={notification} />

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
