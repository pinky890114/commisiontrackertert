import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { FileText, Search, Image as ImageIcon, Lock } from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';

export default function Home() {
  const [isAccepting, setIsAccepting] = useState<boolean | null>(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (doc) => {
      if (doc.exists()) {
        setIsAccepting(doc.data().isAcceptingCommissions);
      } else {
        setIsAccepting(true); // Default to true if not set
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'settings/global');
    });
    return () => unsub();
  }, []);

  const buttons = [
    {
      title: '填寫委託',
      description: isAccepting ? '開始您的委託申請' : '目前暫停接單',
      icon: FileText,
      link: '/commission',
      color: 'bg-ragdoll-sea-blue',
      disabled: isAccepting === false,
    },
    {
      title: '進度追蹤',
      description: '查看您的訂單狀態',
      icon: Search,
      link: '/track',
      color: 'bg-ragdoll-gray-blue',
      disabled: false,
    },
    {
      title: '作品集',
      description: '前往外部作品展示',
      icon: ImageIcon,
      link: 'https://example.com/portfolio', // Replace with real link
      external: true,
      color: 'bg-ragdoll-seal',
      disabled: false,
    },
  ];

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-12">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center space-y-4"
      >
        <h1 className="text-4xl sm:text-5xl font-bold text-ragdoll-seal tracking-tight">
          歡迎來到布偶貓繪圖室
        </h1>
        <p className="text-ragdoll-seal/70 text-lg max-w-lg mx-auto">
          優雅、蓬鬆且溫暖的繪圖委託服務。在這裡，我們將您的靈感轉化為精美的藝術作品。
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full max-w-4xl">
        {buttons.map((btn, idx) => {
          const Content = (
            <motion.div
              whileHover={btn.disabled ? {} : { scale: 1.05, y: -5 }}
              whileTap={btn.disabled ? {} : { scale: 0.95 }}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className={`fluffy-card flex flex-col items-center text-center gap-4 p-8 relative overflow-hidden group ${
                btn.disabled ? 'opacity-60 grayscale cursor-not-allowed' : 'cursor-pointer'
              }`}
            >
              <div className={`${btn.color} p-4 rounded-2xl text-white mb-2 group-hover:rotate-6 transition-transform`}>
                <btn.icon className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-bold">{btn.title}</h3>
              <p className="text-sm text-ragdoll-seal/60">{btn.description}</p>
              
              {btn.disabled && (
                <div className="absolute top-4 right-4 text-ragdoll-seal/40">
                  <Lock className="w-5 h-5" />
                </div>
              )}
            </motion.div>
          );

          if (btn.disabled) return <div key={btn.title}>{Content}</div>;

          if (btn.external) {
            return (
              <a key={btn.title} href={btn.link} target="_blank" rel="noopener noreferrer">
                {Content}
              </a>
            );
          }

          return (
            <Link key={btn.title} to={btn.link}>
              {Content}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
