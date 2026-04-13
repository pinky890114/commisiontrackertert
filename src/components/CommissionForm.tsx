import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Check, Upload, X, Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { db, storage, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { compressImage, generateTempId, cn } from '../lib/utils';
import confetti from 'canvas-confetti';

type Step = 'terms' | 'form' | 'success';

export default function CommissionForm() {
  const [step, setStep] = useState<Step>('terms');
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<{ file: File; preview: string }[]>([]);
  const [formData, setFormData] = useState({
    nickname: '',
    contact: '',
    title: '',
    type: '頭像',
    description: '',
  });
  const [tempId, setTempId] = useState('');

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const files = Array.from(e.target.files);
    
    for (const file of files) {
      const preview = URL.createObjectURL(file as Blob);
      setImages(prev => [...prev, { file: file as File, preview }]);
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => {
      const newImages = [...prev];
      URL.revokeObjectURL(newImages[index].preview);
      newImages.splice(index, 1);
      return newImages;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const newTempId = generateTempId();
    setTempId(newTempId);

    try {
      const imageUrls = [];
      for (const item of images) {
        // Compress image
        const compressedBlob = await compressImage(item.file);
        const fileName = `orders/${newTempId}_${Date.now()}_${Math.random().toString(36).substring(7)}.webp`;
        const storageRef = ref(storage, fileName);
        
        await uploadBytes(storageRef, compressedBlob);
        const url = await getDownloadURL(storageRef);
        imageUrls.push(url);
      }

      await addDoc(collection(db, 'orders'), {
        ...formData,
        referenceImages: imageUrls,
        status: '已填單',
        tempId: newTempId,
        createdAt: serverTimestamp(),
      });

      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#F8F4F0', '#A3B9CC', '#7DA2A9', '#4A3728']
      });

      setStep('success');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <AnimatePresence mode="wait">
        {step === 'terms' && (
          <motion.div
            key="terms"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fluffy-card space-y-6"
          >
            <h2 className="text-2xl font-bold text-center">委託注意事項</h2>
            <div className="bg-ragdoll-cream/50 p-6 rounded-2xl text-sm space-y-4 max-h-96 overflow-y-auto leading-relaxed">
              <p className="font-bold">1. 委託流程</p>
              <p>填單後會生成流水號，確認訂單後會提供正式編號與匯款資訊。匯款完成後即視為排單成功。</p>
              <p className="font-bold">2. 修改次數</p>
              <p>草稿階段可進行 2 次大幅修改，線稿後僅接受微調。成稿後除設定錯誤外不予修改。</p>
              <p className="font-bold">3. 使用權限</p>
              <p>委託作品預設為非商業使用。繪師保有作品著作權，並可能將作品收錄於作品集或公開展示（若需買斷或延後公開請事先告知）。</p>
              <p className="font-bold">4. 退款政策</p>
              <p>草稿前退款 50%，草稿後不予退款。</p>
            </div>
            
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className={cn(
                "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all",
                agreed ? "bg-ragdoll-sea-blue border-ragdoll-sea-blue" : "border-ragdoll-gray-blue group-hover:border-ragdoll-sea-blue"
              )}>
                {agreed && <Check className="text-white w-4 h-4" />}
                <input 
                  type="checkbox" 
                  className="hidden" 
                  checked={agreed} 
                  onChange={() => setAgreed(!agreed)} 
                />
              </div>
              <span className="text-sm font-medium">我已閱讀並同意上述須知</span>
            </label>

            <button
              disabled={!agreed}
              onClick={() => setStep('form')}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              開始填單 <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {step === 'form' && (
          <motion.div
            key="form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="fluffy-card space-y-6"
          >
            <div className="flex items-center gap-4 mb-4">
              <button onClick={() => setStep('terms')} className="p-2 hover:bg-ragdoll-cream rounded-xl transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold">填寫委託資料</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1">暱稱</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-ragdoll-cream/30 border border-ragdoll-cream rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ragdoll-sea-blue/50"
                    value={formData.nickname}
                    onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold ml-1">聯絡方式 (Discord/Mail)</label>
                  <input
                    required
                    type="text"
                    className="w-full bg-ragdoll-cream/30 border border-ragdoll-cream rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ragdoll-sea-blue/50"
                    value={formData.contact}
                    onChange={e => setFormData({ ...formData, contact: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">委託標題</label>
                <input
                  required
                  type="text"
                  className="w-full bg-ragdoll-cream/30 border border-ragdoll-cream rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ragdoll-sea-blue/50"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">委託類型</label>
                <select
                  className="w-full bg-ragdoll-cream/30 border border-ragdoll-cream rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ragdoll-sea-blue/50"
                  value={formData.type}
                  onChange={e => setFormData({ ...formData, type: e.target.value })}
                >
                  <option value="頭像">頭像</option>
                  <option value="半身">半身</option>
                  <option value="全身">全身</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold ml-1">詳細描述 (非必填)</label>
                <textarea
                  rows={4}
                  className="w-full bg-ragdoll-cream/30 border border-ragdoll-cream rounded-xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-ragdoll-sea-blue/50 resize-none"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="space-y-4">
                <label className="text-sm font-bold ml-1">參考圖上傳 (自動壓縮)</label>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
                  {images.map((img, idx) => (
                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={img.preview} alt="preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  <label className="aspect-square rounded-xl border-2 border-dashed border-ragdoll-gray-blue flex flex-col items-center justify-center gap-1 cursor-pointer hover:bg-ragdoll-cream/50 transition-colors">
                    <Upload className="w-6 h-6 text-ragdoll-gray-blue" />
                    <span className="text-[10px] text-ragdoll-gray-blue font-bold">上傳</span>
                    <input type="file" multiple accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : '提交委託'}
              </button>
            </form>
          </motion.div>
        )}

        {step === 'success' && (
          <motion.div
            key="success"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="fluffy-card text-center space-y-6 py-12"
          >
            <div className="bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8" />
            </div>
            <h2 className="text-3xl font-bold">提交成功！</h2>
            <div className="space-y-2">
              <p className="text-ragdoll-seal/60">已收到您的訂單，確認訂單後會給您一組正式的訂單編號。</p>
              <p className="text-sm">您的臨時查詢編號為：</p>
              <div className="bg-ragdoll-cream px-6 py-3 rounded-2xl font-mono text-2xl font-bold text-ragdoll-sea-blue inline-block mt-2">
                {tempId}
              </div>
            </div>
            <p className="text-xs text-ragdoll-seal/40 italic">請務必截圖或記下此編號以供後續查詢進度。</p>
            <button onClick={() => window.location.href = '/'} className="btn-secondary">
              回到首頁
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
