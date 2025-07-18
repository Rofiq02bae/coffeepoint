import { useState } from 'react';

const RedeemVoucher = ({ wallet, onRedeem, loading = false }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const canRedeem = wallet?.balance >= 5;

  const handleRedeem = () => {
    if (canRedeem && onRedeem) {
      onRedeem();
      setShowConfirm(false);
    }
  };

  return (
    <div className="mb-8">
      <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
        <span className="text-xl">🎁</span>
        Redeem Voucher
      </h3>
      
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h4 className="text-xl font-bold mb-2">Coffee Voucher</h4>
            <p className="text-orange-100">Exchange 5 points for 1 free coffee</p>
          </div>
          <div className="text-4xl">☕</div>
        </div>

        {/* Requirements */}
        <div className="bg-white/20 rounded-xl p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">💰</div>
              <div>
                <div className="font-semibold">Your Points</div>
                <div className="text-orange-100">Current balance</div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{wallet?.balance || 0}</div>
              <div className="text-orange-100 text-sm">/ 5 required</div>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-orange-100">Progress</span>
              <span className="text-sm text-orange-100">
                {Math.min(wallet?.balance || 0, 5)}/5 points
              </span>
            </div>
            <div className="w-full bg-white/20 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-yellow-400 to-green-400 h-3 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((wallet?.balance || 0) / 5 * 100, 100)}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Action Button */}
        {!showConfirm ? (
          <button
            onClick={() => canRedeem ? setShowConfirm(true) : null}
            disabled={!canRedeem || loading}
            className={`
              w-full py-4 px-6 rounded-xl font-bold text-lg transition-all duration-300
              ${canRedeem && !loading
                ? 'bg-white text-orange-600 hover:bg-gray-100 hover:scale-105 shadow-lg'
                : 'bg-gray-500 text-gray-300 cursor-not-allowed'
              }
            `}
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-orange-600"></div>
                Processing...
              </div>
            ) : canRedeem ? (
              `🎁 Redeem Voucher (-5 points)`
            ) : (
              `Need ${5 - (wallet?.balance || 0)} more points`
            )}
          </button>
        ) : (
          // Confirmation Dialog
          <div className="bg-white/20 rounded-xl p-4">
            <div className="text-center mb-4">
              <div className="text-2xl mb-2">⚠️</div>
              <h4 className="font-bold mb-2">Confirm Redemption</h4>
              <p className="text-orange-100 text-sm">
                This will deduct 5 points from your wallet and create a new voucher.
              </p>
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 bg-gray-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-gray-700 transition-all duration-300"
              >
                Cancel
              </button>
              <button
                onClick={handleRedeem}
                disabled={loading}
                className="flex-1 bg-white text-orange-600 py-3 px-4 rounded-xl font-bold hover:bg-gray-100 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        )}

        {/* Info */}
        <div className="mt-4 text-center">
          <p className="text-orange-100 text-xs">
            💡 Vouchers are unique NFT-like tokens that can only be used once
          </p>
        </div>
      </div>
    </div>
  );
};

export default RedeemVoucher;
