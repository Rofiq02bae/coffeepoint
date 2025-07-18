import { useState, useEffect } from 'react';

const WalletInfo = ({ wallet, deviceId, notification }) => {
  const [copied, setCopied] = useState(false);

  const copyAddress = () => {
    if (wallet?.address) {
      navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!wallet) {
    return (
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-2xl p-6 text-white mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-3xl">👛</div>
          <div>
            <h3 className="text-lg font-semibold">Wallet Belum Terkoneksi</h3>
            <p className="text-gray-300 text-sm">Scan QR pertama untuk membuat wallet</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-2xl p-6 text-white mb-6">
      {/* Notification Toast */}
      {notification && (
        <div className={`mb-4 p-4 rounded-xl ${
          notification.type === 'success' 
            ? 'bg-green-500/20 border border-green-400/30' 
            : 'bg-red-500/20 border border-red-400/30'
        } animate-pulse-slow`}>
          <div className="flex items-center gap-2">
            <span className="text-xl">
              {notification.type === 'success' ? '🎉' : '⚠️'}
            </span>
            <span className="text-sm font-medium">{notification.message}</span>
          </div>
        </div>
      )}

      {/* Wallet Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="text-3xl">👛</div>
          <div>
            <h3 className="text-lg font-semibold">My Wallet</h3>
            <p className="text-purple-200 text-sm">Coffee Loyalty Wallet</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold">{wallet.balance || 0}</div>
          <div className="text-purple-200 text-sm">Points</div>
        </div>
      </div>

      {/* Wallet Address */}
      <div className="bg-white/10 rounded-xl p-4 mb-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-xs text-purple-200 mb-1">WALLET ADDRESS</div>
            <code className="text-sm font-mono">
              {wallet.address.substring(0, 12)}...{wallet.address.substring(-8)}
            </code>
          </div>
          <button
            onClick={copyAddress}
            className="bg-white/20 hover:bg-white/30 px-3 py-2 rounded-lg transition-all duration-200 text-sm"
          >
            {copied ? '✅ Copied!' : '📋 Copy'}
          </button>
        </div>
      </div>

      {/* Balance Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white/10 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-yellow-300">{wallet.balance || 0}</div>
          <div className="text-xs text-purple-200">Available Points</div>
        </div>
        <div className="bg-white/10 rounded-xl p-4 text-center">
          <div className="text-2xl font-bold text-green-300">{wallet.vouchers?.length || 0}</div>
          <div className="text-xs text-purple-200">Total Vouchers</div>
        </div>
      </div>

      {/* Progress to Next Voucher */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-purple-200">Progress to next voucher</span>
          <span className="text-xs text-purple-200">{(wallet.balance || 0) % 5}/5</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-yellow-400 to-green-400 h-2 rounded-full transition-all duration-500"
            style={{ width: `${((wallet.balance || 0) % 5) * 20}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default WalletInfo;
