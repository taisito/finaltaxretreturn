import React, { useState, useEffect } from 'react';
import { ReceiptData } from '../types';
import { Calendar, Store, Tag, CheckCircle2, AlertTriangle, Calculator, Percent, Save, FileText, ArrowLeft, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';

interface ResultDisplayProps {
  data: ReceiptData;
  previewUrl: string | null;
  onRegister: (finalData: ReceiptData) => void;
  onCancel?: () => void;
  isRegistering: boolean;
}

const CATEGORIES = [
  '消耗品費', '旅費交通費', '会議費', '交際費', '通信費', 
  '水道光熱費', '新聞図書費', '修繕費', '雑費', '工具器具備品', '地代家賃', '車両費'
];

const ResultDisplay: React.FC<ResultDisplayProps> = ({ data, previewUrl, onRegister, onCancel, isRegistering }) => {
  const [formData, setFormData] = useState<ReceiptData>(data);

  // 親から渡された data が変わったら、フォームの状態をリセットする
  useEffect(() => {
    setFormData(data);
  }, [data]);

  // 金額・税率・事業割合が変更されたら、計算フィールドのみを更新する
  useEffect(() => {
    const amount = Number(formData.amount) || 0;
    const rate = formData.taxRate || 10;
    const ratio = formData.businessRatio ?? 100;

    const taxExcluded = Math.round(amount / (1 + rate / 100));
    const taxAmount = amount - taxExcluded;
    const deductibleAmount = Math.floor(amount * (ratio / 100));
    const isAsset = amount >= 100000;

    // 現在のフォームの値と比較して、変更が必要な場合のみ更新（無限ループ防止）
    if (
      formData.taxExcluded !== taxExcluded ||
      formData.taxAmount !== taxAmount ||
      formData.deductibleAmount !== deductibleAmount ||
      formData.isAsset !== isAsset
    ) {
      setFormData(prev => ({
        ...prev,
        taxExcluded,
        taxAmount,
        deductibleAmount,
        isAsset
      }));
    }
  }, [formData.amount, formData.taxRate, formData.businessRatio]);

  const handleChange = (field: keyof ReceiptData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    onRegister(formData);
  };

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('ja-JP', { style: 'currency', currency: 'JPY' }).format(val || 0);
  };

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 h-full pb-10">
      
      {/* Back Button (Mobile only) */}
      {onCancel && (
        <div className="lg:hidden mb-2">
           <button onClick={onCancel} className="text-slate-500 flex items-center text-sm font-medium">
             <ArrowLeft className="w-4 h-4 mr-1" /> 一覧に戻る
           </button>
        </div>
      )}

      {/* Left: Image Preview (Sticky on Desktop) */}
      <div className="w-full lg:w-1/2 lg:sticky lg:top-24 h-fit space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-700 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-blue-600" />
            証憑画像
            </h3>
            {onCancel && (
               <button onClick={onCancel} className="hidden lg:flex text-slate-500 hover:text-slate-800 items-center text-sm font-medium transition-colors">
                 <ArrowLeft className="w-4 h-4 mr-1" /> 一覧に戻る
               </button>
            )}
        </div>
        
        <div className="bg-slate-800 rounded-xl overflow-hidden shadow-lg border border-slate-700 relative group min-h-[300px] flex items-center justify-center">
          {previewUrl ? (
            <img 
              src={previewUrl} 
              alt="Receipt" 
              className="w-full h-auto max-h-[70vh] object-contain mx-auto"
            />
          ) : (
            <div className="text-center p-8">
               <p className="text-slate-400 mb-4">プレビュー画像が表示できません</p>
               {formData.driveLink && (
                  <a 
                    href={formData.driveLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                  >
                     <ExternalLink className="w-4 h-4 mr-2" />
                     Google Driveで確認
                  </a>
               )}
            </div>
          )}
        </div>
      </div>

      {/* Right: Editable Form */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="w-full lg:w-1/2 bg-white rounded-2xl shadow-xl border border-slate-100 p-6 flex flex-col space-y-6"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h2 className="text-xl font-bold text-slate-800 flex items-center">
            <CheckCircle2 className="w-6 h-6 text-green-500 mr-2" />
            {formData.rowIndex ? 'ドラフトの承認・記帳' : '登録内容の確認・修正'}
          </h2>
          {formData.isAsset && (
            <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold flex items-center">
              <AlertTriangle className="w-3 h-3 mr-1" />
              資産計上注意
            </span>
          )}
        </div>

        {/* Basic Info */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-1">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">日付</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="date" 
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
          <div className="col-span-1">
             <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">支払先</label>
             <div className="relative">
              <Store className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <input 
                type="text" 
                value={formData.storeName}
                onChange={(e) => handleChange('storeName', e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              />
            </div>
          </div>
        </div>

        {/* Amount & Category */}
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-1">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">税込金額</label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-slate-500 font-bold">¥</span>
              <input 
                type="number" 
                value={formData.amount}
                onChange={(e) => handleChange('amount', Number(e.target.value))}
                className="w-full pl-8 pr-3 py-2 border border-slate-300 rounded-lg font-bold text-lg text-slate-800 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>
          <div className="col-span-1">
            <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">勘定科目</label>
            <div className="relative">
              <Tag className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
              <select 
                value={formData.category}
                onChange={(e) => handleChange('category', e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none bg-white"
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Invoice & Tax */}
        <div className="bg-slate-50 p-4 rounded-xl space-y-4 border border-slate-100">
          <div className="flex items-center space-x-2 mb-2">
            <div className="bg-indigo-100 p-1.5 rounded-md text-indigo-600">
               <Calculator className="w-4 h-4" />
            </div>
            <h4 className="font-bold text-slate-700 text-sm">税務・インボイス設定</h4>
          </div>

          <div>
             <label className="text-xs font-semibold text-slate-500 uppercase mb-1 block">登録番号 (インボイス)</label>
             <input 
                type="text" 
                placeholder="T1234567890123"
                value={formData.invoiceNumber || ''}
                onChange={(e) => handleChange('invoiceNumber', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg font-mono text-sm outline-none ${
                   formData.invoiceNumber?.startsWith('T') && formData.invoiceNumber.length === 14 
                   ? 'border-green-300 bg-green-50 text-green-800' 
                   : 'border-slate-300'
                }`}
             />
             <div className="flex justify-between mt-1 text-xs text-slate-400">
                <span>税区分: {formData.invoiceNumber ? '適格(予想)' : '区分記載'}</span>
                <span>税率: {formData.taxRate}%</span>
             </div>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
             <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 text-xs block">税抜本体</span>
                <span className="font-medium text-slate-700">{formatCurrency(formData.taxExcluded)}</span>
             </div>
             <div className="bg-white p-2 rounded border border-slate-200">
                <span className="text-slate-500 text-xs block">消費税額</span>
                <span className="font-medium text-slate-700">{formatCurrency(formData.taxAmount)}</span>
             </div>
          </div>
        </div>

        {/* Business Ratio (Apportionment) */}
        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
          <div className="flex items-center justify-between mb-2">
             <div className="flex items-center space-x-2">
                <div className="bg-blue-200 p-1.5 rounded-md text-blue-700">
                  <Percent className="w-4 h-4" />
                </div>
                <h4 className="font-bold text-blue-900 text-sm">家事按分 (事業割合)</h4>
             </div>
             <span className="text-xl font-bold text-blue-700">{formData.businessRatio}%</span>
          </div>
          
          <input 
            type="range" 
            min="0" 
            max="100" 
            step="5"
            value={formData.businessRatio}
            onChange={(e) => handleChange('businessRatio', Number(e.target.value))}
            className="w-full h-2 bg-blue-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
          />
          
          <div className="mt-3 flex justify-between items-center bg-white/50 p-3 rounded-lg">
             <span className="text-sm text-blue-800 font-medium">経費計上額</span>
             <span className="text-lg font-bold text-blue-700">{formatCurrency(formData.deductibleAmount)}</span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2">
           <button
             onClick={handleSave}
             disabled={isRegistering}
             className={`
               w-full py-4 rounded-xl font-bold text-white shadow-lg flex items-center justify-center transition-all
               ${isRegistering 
                 ? 'bg-slate-400 cursor-not-allowed' 
                 : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]'
               }
             `}
           >
             {isRegistering ? (
               '処理中...'
             ) : (
               <>
                 <Save className="w-5 h-5 mr-2" />
                 {formData.rowIndex ? '承認して記帳する' : '内容を確定して記帳する'}
               </>
             )}
           </button>
        </div>

      </motion.div>
    </div>
  );
};

export default ResultDisplay;