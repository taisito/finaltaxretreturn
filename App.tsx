import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowRight, RefreshCw, AlertTriangle, LayoutDashboard, ScanLine, Check, ListChecks } from 'lucide-react';
import UploadArea from './components/UploadArea';
import ResultDisplay from './components/ResultDisplay';
import Dashboard from './components/Dashboard';
import ReviewList from './components/ReviewList';
import { AnalyzeResult, UploadStatus, ReceiptData } from './types';
import { analyzeReceipt, registerReceipt, fetchPendingReceipts, triggerFolderScan } from './services/api';
import { GAS_WEB_APP_URL } from './constants';

type Tab = 'dashboard' | 'scan' | 'review';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  
  // States for Upload/Scan Flow
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [status, setStatus] = useState<UploadStatus>(UploadStatus.IDLE);
  const [result, setResult] = useState<ReceiptData | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // States for Review Flow
  const [pendingItems, setPendingItems] = useState<ReceiptData[]>([]);
  const [isScanningFolder, setIsScanningFolder] = useState(false);
  const [selectedReviewItem, setSelectedReviewItem] = useState<ReceiptData | null>(null);

  // Load pending items when entering Review tab
  useEffect(() => {
    if (activeTab === 'review' && !selectedReviewItem) {
      loadPendingItems();
    }
  }, [activeTab]);

  const loadPendingItems = async () => {
    const items = await fetchPendingReceipts();
    setPendingItems(items);
  };

  const handleFolderScan = async () => {
    setIsScanningFolder(true);
    await triggerFolderScan();
    await loadPendingItems();
    setIsScanningFolder(false);
  };

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(selectedFile);
    setStatus(UploadStatus.PREVIEW);
    setResult(null);
    setErrorMessage(null);
  };

  const handleAnalyze = async () => {
    if (!file) return;
    setStatus(UploadStatus.UPLOADING);
    setErrorMessage(null);
    const response: AnalyzeResult = await analyzeReceipt(file);
    if (response.success && response.data) {
      setResult(response.data);
      setStatus(UploadStatus.EDITING);
    } else {
      setErrorMessage(response.error || '不明なエラーが発生しました');
      setStatus(UploadStatus.ERROR);
    }
  };

  const handleRegister = async (finalData: ReceiptData) => {
    setStatus(UploadStatus.REGISTERING);
    const response = await registerReceipt(finalData);

    if (response.success) {
      setStatus(UploadStatus.SUCCESS);
      // If we were in review mode, remove the item from the list
      if (activeTab === 'review' && selectedReviewItem) {
         setPendingItems(prev => prev.filter(item => item.id !== selectedReviewItem.id && item.rowIndex !== selectedReviewItem.rowIndex));
         setSelectedReviewItem(null);
         // Return to list after short delay
         setTimeout(() => {
            setStatus(UploadStatus.IDLE);
         }, 1500);
      }
    } else {
      setErrorMessage(response.error || '記帳に失敗しました。GASのデプロイURLを確認してください。');
      setStatus(UploadStatus.EDITING);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreviewUrl(null);
    setStatus(UploadStatus.IDLE);
    setResult(null);
    setErrorMessage(null);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-24 md:pb-10">
      {/* Header */}
      <header className="w-full bg-white border-b border-slate-200 sticky top-0 z-20 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="bg-gradient-to-tr from-blue-700 to-indigo-600 text-white p-2 rounded-lg shadow-md">
               <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
               </svg>
            </div>
            <div>
              <h1 className="text-lg font-bold text-slate-800 tracking-tight">
                AI確定申告アシスタント <span className="text-xs font-normal text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full ml-1">Pro</span>
              </h1>
            </div>
          </div>
          
          {!GAS_WEB_APP_URL && (
             <div className="hidden md:flex text-xs bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full items-center font-medium">
                <AlertTriangle className="w-3 h-3 mr-1"/> デモモード
             </div>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        
        {/* Navigation Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-slate-200 overflow-x-auto">
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'dashboard' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 mr-2" />
              ダッシュボード
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`flex items-center px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'review' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <ListChecks className="w-4 h-4 mr-2" />
              未処理 ({pendingItems.length})
            </button>
            <button
              onClick={() => setActiveTab('scan')}
              className={`flex items-center px-4 md:px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === 'scan' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800 hover:bg-slate-50'
              }`}
            >
              <ScanLine className="w-4 h-4 mr-2" />
              新規スキャン
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          
          {/* DASHBOARD TAB */}
          {activeTab === 'dashboard' && (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              <Dashboard />
            </motion.div>
          )}

          {/* REVIEW TAB */}
          {activeTab === 'review' && (
             <motion.div
               key="review"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               transition={{ duration: 0.2 }}
             >
                {selectedReviewItem ? (
                   // Show Editor for Pending Item
                   status === UploadStatus.SUCCESS ? (
                      // Success Message
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="max-w-md mx-auto bg-white rounded-3xl p-10 shadow-2xl border border-green-100 text-center space-y-6"
                      >
                         <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                            <Check className="w-10 h-10 text-green-600" />
                         </div>
                         <div>
                            <h2 className="text-2xl font-bold text-slate-800">承認完了</h2>
                            <p className="text-slate-500 mt-2">正式に記帳されました。</p>
                         </div>
                         <button 
                            onClick={() => {
                               setStatus(UploadStatus.IDLE);
                               setSelectedReviewItem(null);
                            }}
                            className="w-full bg-slate-800 text-white py-3.5 rounded-xl font-bold hover:bg-slate-700 transition-colors flex items-center justify-center"
                         >
                            <ArrowRight className="w-4 h-4 mr-2" />
                            一覧に戻る
                         </button>
                      </motion.div>
                   ) : (
                      // Editor
                      <ResultDisplay 
                         key={selectedReviewItem.id || selectedReviewItem.rowIndex} // ここでkeyを指定して再マウントを強制
                         data={selectedReviewItem} 
                         previewUrl={null}
                         onRegister={handleRegister} 
                         onCancel={() => setSelectedReviewItem(null)}
                         isRegistering={status === UploadStatus.REGISTERING} 
                      />
                   )
                ) : (
                   // Show List
                   <ReviewList 
                      items={pendingItems} 
                      onSelect={(item) => {
                         setSelectedReviewItem(item);
                         setStatus(UploadStatus.EDITING);
                      }}
                      onScan={handleFolderScan}
                      isScanning={isScanningFolder}
                   />
                )}
             </motion.div>
          )}

          {/* SCAN TAB */}
          {activeTab === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              {(status === UploadStatus.IDLE || status === UploadStatus.PREVIEW || status === UploadStatus.UPLOADING || status === UploadStatus.ERROR) && (
                <div className="max-w-2xl mx-auto space-y-8">
                   <div className="bg-white rounded-2xl p-8 shadow-sm border border-slate-200">
                      <div className="mb-6 text-center">
                        <h2 className="text-2xl font-bold text-slate-800 mb-2">領収書のアップロード</h2>
                        <p className="text-slate-500 text-sm">手動でファイルをアップロードして解析します</p>
                      </div>

                      {!previewUrl ? (
                         <UploadArea onFileSelect={handleFileSelect} />
                      ) : (
                        <div className="space-y-6">
                           <div className="relative group w-full h-80 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-inner flex items-center justify-center">
                              <img 
                                src={previewUrl} 
                                alt="Preview" 
                                className="max-w-full max-h-full object-contain"
                              />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                 <button 
                                   onClick={handleReset}
                                   className="bg-white text-slate-800 px-5 py-2.5 rounded-lg font-bold shadow-lg flex items-center hover:scale-105 transition-transform"
                                 >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    別の画像を選ぶ
                                 </button>
                              </div>
                           </div>
                           <div className="flex justify-center">
                              <button
                                onClick={handleAnalyze}
                                disabled={status === UploadStatus.UPLOADING}
                                className={`
                                  flex items-center justify-center px-10 py-4 rounded-full text-lg font-bold shadow-xl transition-all w-full
                                  ${status === UploadStatus.UPLOADING 
                                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
                                    : 'bg-blue-600 text-white hover:bg-blue-700 hover:shadow-2xl hover:-translate-y-1'
                                  }
                                `}
                              >
                                {status === UploadStatus.UPLOADING ? (
                                  <>
                                     <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                                     AI解析中...
                                  </>
                                ) : (
                                  <>
                                     解析を開始する
                                     <ArrowRight className="w-5 h-5 ml-2" />
                                  </>
                                )}
                              </button>
                           </div>
                        </div>
                      )}
                   </div>
                   {status === UploadStatus.ERROR && errorMessage && (
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3 text-red-700"
                      >
                         <AlertTriangle className="w-5 h-5" />
                         <span className="font-medium">{errorMessage}</span>
                      </motion.div>
                   )}
                </div>
              )}

              {/* EDITOR (Manual Upload) */}
              {(status === UploadStatus.EDITING || status === UploadStatus.REGISTERING) && result && (
                 <ResultDisplay 
                    key={result.id || 'manual'} 
                    data={result} 
                    previewUrl={previewUrl} 
                    onRegister={handleRegister} 
                    isRegistering={status === UploadStatus.REGISTERING} 
                 />
              )}

              {/* SUCCESS (Manual Upload) */}
              {status === UploadStatus.SUCCESS && (
                 <motion.div 
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   className="max-w-md mx-auto bg-white rounded-3xl p-10 shadow-2xl border border-green-100 text-center space-y-6"
                 >
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                       <Check className="w-10 h-10 text-green-600" />
                    </div>
                    <div>
                       <h2 className="text-2xl font-bold text-slate-800">記帳が完了しました</h2>
                       <p className="text-slate-500 mt-2">スプレッドシートにデータが保存されました。</p>
                    </div>
                    <button 
                       onClick={handleReset}
                       className="w-full bg-slate-800 text-white py-3.5 rounded-xl font-bold hover:bg-slate-700 transition-colors flex items-center justify-center"
                    >
                       <RefreshCw className="w-4 h-4 mr-2" />
                       次の領収書をスキャン
                    </button>
                 </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;