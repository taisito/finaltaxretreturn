import React from 'react';
import { ReceiptData } from '../types';
import { FileText, AlertTriangle, ArrowRight, Calendar, Tag, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';

interface ReviewListProps {
  items: ReceiptData[];
  onSelect: (item: ReceiptData) => void;
  onScan: () => void;
  isScanning: boolean;
}

const ReviewList: React.FC<ReviewListProps> = ({ items, onSelect, onScan, isScanning }) => {
  const formatCurrency = (val?: number) => 
    new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(val || 0);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
             <h2 className="text-2xl font-bold text-slate-800 flex items-center">
               <FileText className="w-6 h-6 mr-2 text-blue-600" />
               未処理データ一覧
             </h2>
             <p className="text-slate-500 text-sm mt-1">
               解析済み・未承認のデータです。内容を確認・修正して承認してください。
             </p>
          </div>
          <button 
             onClick={onScan}
             disabled={isScanning}
             className={`px-6 py-3 rounded-xl font-bold text-white shadow-md transition-all flex items-center whitespace-nowrap ${
                isScanning ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:shadow-lg'
             }`}
          >
             <RefreshCw className={`w-4 h-4 mr-2 ${isScanning ? 'animate-spin' : ''}`} />
             {isScanning ? '取り込み中...' : '新規画像を取り込み'}
          </button>
        </div>

        {items.length === 0 ? (
           <div className="text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
              <p className="text-slate-500 font-medium">未処理のデータはありません</p>
              <p className="text-xs text-slate-400 mt-2">
                新しい領収書画像をGoogle Driveの入力フォルダに入れて<br/>
                「新規画像を取り込み」ボタンを押してください
              </p>
           </div>
        ) : (
           <div className="grid gap-4">
              {items.map((item, idx) => (
                 <motion.div 
                    key={item.id || idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => onSelect(item)}
                    className="group bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                 >
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex items-center justify-between">
                       <div className="flex items-center space-x-4">
                          <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400">
                             {/* 画像サムネイルがあればここに表示 */}
                             <FileText className="w-6 h-6" />
                          </div>
                          <div>
                             <h3 className="font-bold text-slate-800">{item.storeName || '店名不明'}</h3>
                             <div className="flex items-center text-xs text-slate-500 mt-1 space-x-3">
                                <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {item.date}</span>
                                <span className="flex items-center"><Tag className="w-3 h-3 mr-1" /> {item.category}</span>
                             </div>
                          </div>
                       </div>
                       
                       <div className="text-right flex items-center space-x-4">
                          <div>
                             <div className="font-bold text-lg text-slate-800">{formatCurrency(item.amount)}</div>
                             {item.isAsset && (
                                <span className="text-[10px] font-bold text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full flex items-center justify-end">
                                   <AlertTriangle className="w-3 h-3 mr-1" /> 資産
                                </span>
                             )}
                          </div>
                          <div className="bg-slate-100 p-2 rounded-full text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                             <ArrowRight className="w-5 h-5" />
                          </div>
                       </div>
                    </div>
                 </motion.div>
              ))}
           </div>
        )}
      </div>
    </div>
  );
};

export default ReviewList;