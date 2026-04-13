import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Search, Loader2, PawPrint, CheckCircle2, Clock } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';
import { cn } from '../lib/utils';

const STEPS = ['已填單', '排單中', '草稿', '線稿', '色稿', '成圖', '已交付'];

export default function ProgressTracker() {
  const [searchId, setSearchId] = useState('');
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchId.trim()) return;

    setLoading(true);
    setError('');
    setOrder(null);

    try {
      // Search by tempId or official orderNumber
      const q = query(
        collection(db, 'orders'),
        where('tempId', '==', searchId.toUpperCase()),
        limit(1)
      );
      const q2 = query(
        collection(db, 'orders'),
        where('orderNumber', '==', searchId.toUpperCase()),
        limit(1)
      );

      let snapshot = await getDocs(q);
      if (snapshot.empty) {
        snapshot = await getDocs(q2);
      }

      if (snapshot.empty) {
        setError('找不到該編號的訂單，請檢查是否輸入正確。');
      } else {
        setOrder(snapshot.docs[0].data());
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'orders');
    } finally {
      setLoading(false);
    }
  };

  const currentStepIndex = order ? STEPS.indexOf(order.status) : -1;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">進度追蹤</h2>
        <p className="text-ragdoll-seal/60">輸入您的臨時流水號或正式訂單編號查詢進度</p>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2 max-w-md mx-auto">
        <input
          type="text"
          placeholder="輸入編號 (例如: A1B2C3D4)"
          className="flex-grow bg-white border border-ragdoll-cream rounded-2xl px-6 py-3 focus:outline-none focus:ring-2 focus:ring-ragdoll-sea-blue/50 soft-shadow"
          value={searchId}
          onChange={e => setSearchId(e.target.value)}
        />
        <button type="submit" disabled={loading} className="btn-primary flex items-center gap-2">
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
        </button>
      </form>

      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="bg-red-50 text-red-600 p-4 rounded-2xl text-center text-sm font-medium"
          >
            {error}
          </motion.div>
        )}

        {order && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fluffy-card space-y-8 p-8 sm:p-12"
          >
            <div className="flex flex-wrap justify-between items-end gap-4 border-b border-ragdoll-cream pb-6">
              <div>
                <h3 className="text-2xl font-bold text-ragdoll-sea-blue">{order.title}</h3>
                <p className="text-sm text-ragdoll-seal/60">委託人：{order.nickname}</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-ragdoll-seal/40 uppercase font-bold tracking-widest">Order Status</p>
                <p className="text-lg font-bold text-ragdoll-seal">{order.status}</p>
              </div>
            </div>

            {/* Horizontal Stepper */}
            <div className="relative pt-12 pb-4 overflow-x-auto">
              <div className="min-w-[600px] px-4">
                <div className="relative flex justify-between">
                  {/* Background Line */}
                  <div className="absolute top-5 left-0 w-full h-0.5 bg-ragdoll-cream -z-10" />
                  {/* Active Line */}
                  <div 
                    className="absolute top-5 left-0 h-0.5 bg-ragdoll-sea-blue -z-10 transition-all duration-1000"
                    style={{ width: `${(currentStepIndex / (STEPS.length - 1)) * 100}%` }}
                  />

                  {STEPS.map((step, idx) => {
                    const isActive = idx <= currentStepIndex;
                    const isCurrent = idx === currentStepIndex;

                    return (
                      <div key={step} className="flex flex-col items-center gap-3 relative">
                        <div className={cn(
                          "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-500 border-4",
                          isActive ? "bg-ragdoll-sea-blue border-white text-white soft-shadow scale-110" : "bg-white border-ragdoll-cream text-ragdoll-cream"
                        )}>
                          {isActive ? (
                            isCurrent ? <Clock className="w-5 h-5 animate-pulse" /> : <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <PawPrint className="w-4 h-4" />
                          )}
                        </div>
                        <span className={cn(
                          "text-[10px] font-bold whitespace-nowrap transition-colors duration-500",
                          isActive ? "text-ragdoll-sea-blue" : "text-ragdoll-seal/30"
                        )}>
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="bg-ragdoll-cream/30 p-6 rounded-2xl space-y-2">
              <p className="text-sm font-bold">委託詳情</p>
              <p className="text-sm text-ragdoll-seal/80 leading-relaxed">
                {order.description || '無詳細描述'}
              </p>
              <div className="pt-4 flex gap-2">
                <span className="bg-ragdoll-sea-blue/10 text-ragdoll-sea-blue text-[10px] font-bold px-2 py-1 rounded-md">
                  類型：{order.type}
                </span>
                <span className="bg-ragdoll-gray-blue/10 text-ragdoll-gray-blue text-[10px] font-bold px-2 py-1 rounded-md">
                  編號：{order.orderNumber || order.tempId}
                </span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
