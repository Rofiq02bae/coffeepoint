import { QRCodeSVG } from "qrcode.react";

const VoucherList = ({ vouchers = [], onUseVoucher }) => {
  if (!vouchers || vouchers.length === 0) {
    return (
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 text-center border border-white/20">
        <div className="text-6xl mb-4">🎟️</div>
        <h3 className="text-xl font-semibold mb-2">No Vouchers Yet</h3>
        <p className="text-gray-300">Collect 5 points to get your first voucher!</p>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
        <span className="text-xl">🎟️</span>
        My Vouchers ({vouchers.length})
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {vouchers.map((voucher, index) => (
          <div
            key={voucher.id}
            className={`
              bg-white/15 backdrop-blur-lg rounded-2xl p-6 border border-white/20
              ${voucher.used ? 'opacity-60' : 'hover:-translate-y-1'} 
              transition-all duration-300
            `}
          >
            {/* Voucher Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">🎟️</span>
                <div>
                  <div className="font-semibold">Voucher #{vouchers.length - index}</div>
                  <div className="text-sm text-gray-300">
                    {voucher.created_at?.toDate ? 
                      voucher.created_at.toDate().toLocaleDateString() : 
                      'Today'
                    }
                  </div>
                </div>
              </div>
              
              <div className={`
                px-3 py-1 rounded-full text-xs font-semibold
                ${voucher.used 
                  ? 'bg-gray-500 text-white' 
                  : 'bg-green-500 text-white animate-pulse'
                }
              `}>
                {voucher.used ? '✅ Used' : '🔄 Active'}
              </div>
            </div>

            {/* Voucher ID */}
            <div className="bg-white/10 rounded-xl p-3 mb-4">
              <div className="text-xs text-gray-300 mb-1">VOUCHER ID</div>
              <code className="text-sm font-mono break-all">
                {voucher.id}
              </code>
            </div>

            {/* QR Code */}
            {!voucher.used && (
              <div className="bg-white rounded-xl p-4 mb-4">
                <div className="flex justify-center">
                  <QRCodeSVG 
                    value={`${window.location.origin}/redeem?token=${voucher.id}`}
                    size={120}
                  />
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              {voucher.used ? (
                <div className="w-full bg-gray-600 text-white py-2 px-4 rounded-xl text-center font-medium">
                  ✅ Already Redeemed
                </div>
              ) : (
                <>
                  <a
                    href={`/redeem?token=${voucher.id}`}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-2 px-4 rounded-xl text-center font-medium hover:from-green-600 hover:to-emerald-700 transition-all duration-300"
                  >
                    🔗 Use Now
                  </a>
                  
                  <button
                    onClick={() => onUseVoucher && onUseVoucher(voucher.id)}
                    className="bg-purple-600 hover:bg-purple-700 text-white py-2 px-4 rounded-xl font-medium transition-all duration-300"
                  >
                    📱 Show QR
                  </button>
                </>
              )}
            </div>

            {/* Voucher Value */}
            <div className="mt-4 text-center">
              <div className="text-sm text-gray-300">Voucher Value</div>
              <div className="text-lg font-bold text-yellow-400">☕ 1 Free Coffee</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default VoucherList;
