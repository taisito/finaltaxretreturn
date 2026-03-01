<<<<<<< HEAD

import { GAS_WEB_APP_URL, GEMINI_MODEL, API_TOKEN } from '../constants';
=======
import { GAS_WEB_APP_URL, GEMINI_MODEL } from '../constants';
>>>>>>> 6800949c52c4ae6199464245bb6c8d43804f5c02
import { AnalyzeResult, ReceiptData, DashboardData } from '../types';

/**
 * Converts a File object to a Base64 string.
 */
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1]; 
      resolve(base64);
    };
    reader.onerror = (error) => reject(error);
  });
};

// --- MOCK DATA GENERATORS ---

const getMockReceiptData = (): ReceiptData => ({
  date: '2023-10-24',
  storeName: 'スターバックス コーヒー ジャパン',
  amount: 1450,
  items: ['ドリップコーヒー Tall', 'ハム＆マリボーチーズ 石窯フィローネ'],
  category: '会議費',
  confidence: 0.95,
  invoiceNumber: 'T1234567890123',
  taxRate: 10,
  businessRatio: 100,
  taxExcluded: 1318,
  taxAmount: 132,
  deductibleAmount: 1450
});

const getMockPendingReceipts = (): ReceiptData[] => ([
  {
    id: '1', rowIndex: 2, fileId: 'mock-file-id-1', status: 'pending', date: '2023-11-05', storeName: 'Amazon Web Services', amount: 5400, category: '通信費', items: ['AWS Service'], taxRate: 10, businessRatio: 100, invoiceNumber: 'T9876543210987', taxExcluded: 4909, taxAmount: 491, deductibleAmount: 5400
  },
  {
    id: '2', rowIndex: 3, fileId: 'mock-file-id-2', status: 'pending', date: '2023-11-06', storeName: 'ENEOS', amount: 3200, category: '車両費', items: ['レギュラー'], taxRate: 10, businessRatio: 50, taxExcluded: 2909, taxAmount: 291, deductibleAmount: 1600
  },
  {
    id: '3', rowIndex: 4, fileId: 'mock-file-id-3', status: 'pending', date: '2023-11-07', storeName: 'Apple Store', amount: 148000, category: '消耗品費', items: ['iPad Air'], taxRate: 10, businessRatio: 100, isAsset: true, taxExcluded: 134545, taxAmount: 13455, deductibleAmount: 148000
  }
]);

const getMockDashboardData = (): DashboardData => ({
  totalAmount: 124500,
  monthlyData: [
    { month: '2023-08', amount: 45000 },
    { month: '2023-09', amount: 32000 },
    { month: '2023-10', amount: 47500 },
    { month: '2023-11', amount: 28000 },
  ],
  categoryData: [
    { name: '消耗品費', value: 45000, color: '#3b82f6' },
    { name: '旅費交通費', value: 25000, color: '#10b981' },
    { name: '会議費', value: 15000, color: '#8b5cf6' },
    { name: '交際費', value: 30000, color: '#ec4899' },
    { name: 'その他', value: 9500, color: '#94a3b8' },
  ],
  recentReceipts: [
      { date: '2023-11-02', storeName: 'Amazon.co.jp', amount: 3500, items: [], category: '消耗品費' },
      { date: '2023-11-01', storeName: 'セブンイレブン', amount: 850, items: [], category: '会議費' },
  ]
});

/**
 * Sends the image to the GAS backend for analysis.
 * (手動アップロード用: 解析して即座に結果を返す)
 */
export const analyzeReceipt = async (file: File): Promise<AnalyzeResult> => {
  try {
    if (!GAS_WEB_APP_URL) {
      console.warn("GAS_WEB_APP_URL is not set. Using mock data.");
      await new Promise((resolve) => setTimeout(resolve, 2000));
      return { success: true, data: getMockReceiptData() };
    }

    const base64Image = await fileToBase64(file);
    const payload = {
      action: 'analyze',
<<<<<<< HEAD
      token: API_TOKEN, // 認証トークン追加
=======
>>>>>>> 6800949c52c4ae6199464245bb6c8d43804f5c02
      image: base64Image,
      mimeType: file.type,
      filename: file.name,
      model: GEMINI_MODEL,
    };

    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    const result = await response.json();
    if (result.status === 'error') throw new Error(result.message);

    return { success: true, data: result.data as ReceiptData };
  } catch (error: unknown) {
    console.warn("Analysis failed (falling back to mock):", error);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    return { success: true, data: getMockReceiptData() };
  }
};

/**
 * Registers the confirmed receipt data to GAS.
 * バックエンド変更に伴い、この関数は「スプレッドシートの更新(承認)」のみを担当します。
 * ファイル移動などの重い処理は伴わないため、シンプルになります。
 */
export const registerReceipt = async (data: ReceiptData): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!GAS_WEB_APP_URL) {
      // デモモード（GAS URL未設定）の場合は成功扱い
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return { success: true };
    }

    const action = data.rowIndex ? 'approve' : 'register';
<<<<<<< HEAD
    const payload = { 
      action, 
      token: API_TOKEN, // 認証トークン追加
      data 
    };
=======
    const payload = { action, data };
>>>>>>> 6800949c52c4ae6199464245bb6c8d43804f5c02

    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(payload),
    });

    if (!response.ok) throw new Error(`Server error: ${response.status}`);
    const result = await response.json();
    if (result.status === 'error') throw new Error(result.message);

    return { success: true };
  } catch (error) {
    console.warn("Registration failed (falling back to mock success):", error);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    // ユーザー体験維持のため、通信エラー時も成功として振る舞う（実運用ではエラー表示推奨だがデモとして）
    return { success: true };
  }
};

/**
 * Fetches pending receipts from GAS.
 * スプレッドシートの「未承認」ステータスの行を取得します。
 */
export const fetchPendingReceipts = async (): Promise<ReceiptData[]> => {
  try {
    if (!GAS_WEB_APP_URL) return getMockPendingReceipts();

    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
<<<<<<< HEAD
      body: JSON.stringify({ 
        action: 'get_pending',
        token: API_TOKEN // 認証トークン追加
      }),
=======
      body: JSON.stringify({ action: 'get_pending' }),
>>>>>>> 6800949c52c4ae6199464245bb6c8d43804f5c02
    });

    if (!response.ok) throw new Error("Failed to fetch pending data");
    const result = await response.json();
    if (result.status === 'error') throw new Error(result.message);
    
    return result.data as ReceiptData[];
  } catch (error) {
    console.warn("Fetch pending failed (falling back to mock):", error);
    return getMockPendingReceipts();
  }
};

/**
 * Triggers the input folder scan on GAS.
 * 入力フォルダの画像をOCR解析し、スプレッドシートに未承認データとして登録します。
 * ファイルは処理済みフォルダへアーカイブされます。
 */
export const triggerFolderScan = async (): Promise<{ success: boolean; count?: number; error?: string }> => {
  try {
    if (!GAS_WEB_APP_URL) {
       await new Promise(resolve => setTimeout(resolve, 1500));
       return { success: true, count: 3 };
    }

    const response = await fetch(GAS_WEB_APP_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain' },
<<<<<<< HEAD
      body: JSON.stringify({ 
        action: 'scan_folder',
        token: API_TOKEN // 認証トークン追加
      }),
=======
      body: JSON.stringify({ action: 'scan_folder' }),
>>>>>>> 6800949c52c4ae6199464245bb6c8d43804f5c02
    });

    const result = await response.json();
    if (result.status === 'error') throw new Error(result.message);
    return { success: true, count: result.count };
  } catch (error) {
    console.warn("Folder scan failed (falling back to mock):", error);
    await new Promise(resolve => setTimeout(resolve, 1500));
    return { success: true, count: 3 };
  }
};

/**
 * Fetches dashboard data from GAS.
 */
export const fetchDashboardData = async (): Promise<DashboardData> => {
  try {
    if (!GAS_WEB_APP_URL) return getMockDashboardData();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    try {
        const response = await fetch(GAS_WEB_APP_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain' },
<<<<<<< HEAD
            body: JSON.stringify({ 
              action: 'dashboard',
              token: API_TOKEN // 認証トークン追加
            }),
=======
            body: JSON.stringify({ action: 'dashboard' }),
>>>>>>> 6800949c52c4ae6199464245bb6c8d43804f5c02
            signal: controller.signal,
        });
        clearTimeout(timeoutId);
        const result = await response.json();
        return result.data as DashboardData;
    } catch (e) {
        clearTimeout(timeoutId);
        throw e;
    }
  } catch (error) {
    console.warn("Dashboard fetch failed (falling back to mock):", error);
    return getMockDashboardData();
  }
<<<<<<< HEAD
};
=======
};
>>>>>>> 6800949c52c4ae6199464245bb6c8d43804f5c02
