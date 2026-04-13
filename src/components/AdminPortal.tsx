import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { db, auth, googleProvider, handleFirestoreError, OperationType } from '../lib/firebase';
import { signInWithPopup, onAuthStateChanged, signOut, User } from 'firebase/auth';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, setDoc, getDoc } from 'firebase/firestore';
import { Loader2, LogIn, LogOut, Edit2, Check, X, PawPrint, ExternalLink, Power } from 'lucide-react';
import { cn } from '../lib/utils';

const STEPS = ['已填單', '排單中', '草稿', '線稿', '色稿', '成圖', '已交付'];

export default function AdminPortal() {
  const [loading, setLoading] = useState(true);
  const [orders, setOrders] = useState<any[]>([]);
  const [isAccepting, setIsAccepting] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editData, setEditData] = useState<any>(null);

  useEffect(() => {
    const unsubSettings = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) setIsAccepting(doc.data().isAcceptingCommissions);
      setLoading(false);
    });

    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    const unsubOrders = onSnapshot(q, (snapshot) => {
      setOrders(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'orders');
    });

    return () => {
      unsubSettings();
      unsubOrders();
    };
  }, []);

  const toggleAccepting = async () => {
    try {
      await setDoc(doc(db, 'settings', 'global'), { isAcceptingCommissions: !isAccepting }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, 'settings/global');
    }
  };

  const startEdit = (order: any) => {
    setEditingId(order.id);
    setEditData({ ...order });
  };

  const saveEdit = async () => {
    if (!editingId) return;
    try {
      const { id, ...data } = editData;
      await updateDoc(doc(db, 'orders', editingId), data);
      setEditingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${editingId}`);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 animate-spin text-ragdoll-sea-blue" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">訂單管理後台</h2>
          <p className="text-ragdoll-seal/60">開發模式：已暫時移除登入限制</p>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={toggleAccepting}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl font-bold text-sm transition-all",
              isAccepting ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
            )}
          >
            <Power className="w-4 h-4" />
            {isAccepting ? '目前接單中' : '目前暫停接單'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {orders.map(order => (
          <div key={order.id} className="fluffy-card overflow-hidden">
            {editingId === order.id ? (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-ragdoll-seal/40">正式編號</label>
                    <input
                      type="text"
                      className="w-full bg-ragdoll-cream/30 border border-ragdoll-cream rounded-lg px-3 py-2 text-sm"
                      value={editData.orderNumber || ''}
                      onChange={e => setEditData({ ...editData, orderNumber: e.target.value.toUpperCase() })}
                      placeholder="例如: RAG-001"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-ragdoll-seal/40">進度狀態</label>
                    <select
                      className="w-full bg-ragdoll-cream/30 border border-ragdoll-cream rounded-lg px-3 py-2 text-sm"
                      value={editData.status}
                      onChange={e => setEditData({ ...editData, status: e.target.value })}
                    >
                      {STEPS.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <button onClick={saveEdit} className="btn-primary flex-grow py-2">
                      <Check className="w-4 h-4 mx-auto" />
                    </button>
                    <button onClick={() => setEditingId(null)} className="btn-secondary flex-grow py-2">
                      <X className="w-4 h-4 mx-auto" />
                    </button>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-ragdoll-seal/40">暱稱</label>
                    <input
                      type="text"
                      className="w-full bg-ragdoll-cream/30 border border-ragdoll-cream rounded-lg px-3 py-2 text-sm"
                      value={editData.nickname}
                      onChange={e => setEditData({ ...editData, nickname: e.target.value })}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase text-ragdoll-seal/40">聯絡方式</label>
                    <input
                      type="text"
                      className="w-full bg-ragdoll-cream/30 border border-ragdoll-cream rounded-lg px-3 py-2 text-sm"
                      value={editData.contact}
                      onChange={e => setEditData({ ...editData, contact: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row justify-between gap-6">
                <div className="space-y-2 flex-grow">
                  <div className="flex items-center gap-3">
                    <span className="bg-ragdoll-sea-blue text-white text-[10px] font-bold px-2 py-0.5 rounded">
                      {order.status}
                    </span>
                    <h3 className="font-bold text-lg">{order.title}</h3>
                  </div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-ragdoll-seal/60">
                    <span>委託人: {order.nickname}</span>
                    <span>聯絡: {order.contact}</span>
                    <span>類型: {order.type}</span>
                    <span className="font-mono">流水號: {order.tempId}</span>
                    {order.orderNumber && <span className="font-mono font-bold text-ragdoll-sea-blue">正式編號: {order.orderNumber}</span>}
                  </div>
                  <p className="text-sm text-ragdoll-seal/80 line-clamp-2">{order.description}</p>
                  
                  {order.referenceImages?.length > 0 && (
                    <div className="flex gap-2 pt-2">
                      {order.referenceImages.map((url: string, i: number) => (
                        <a key={i} href={url} target="_blank" rel="noreferrer" className="w-12 h-12 rounded-lg overflow-hidden border border-ragdoll-cream hover:opacity-80 transition-opacity">
                          <img src={url} alt="ref" className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>
                
                <div className="flex flex-row sm:flex-col gap-2 justify-end">
                  <button onClick={() => startEdit(order)} className="btn-secondary p-3">
                    <Edit2 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => {
                      const msg = `【進度更新】您的委託「${order.title}」目前狀態已更新為：${order.status}。請至追蹤頁面查看詳情！`;
                      navigator.clipboard.writeText(msg);
                      alert('已複製更新訊息！');
                    }}
                    className="btn-secondary p-3"
                    title="複製更新訊息"
                  >
                    <ExternalLink className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
        {orders.length === 0 && (
          <div className="text-center py-20 text-ragdoll-seal/40">
            目前還沒有任何訂單。
          </div>
        )}
      </div>
    </div>
  );
}
