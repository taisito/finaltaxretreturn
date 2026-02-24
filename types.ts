export interface ReceiptData {
  id?: string; // ユニークID (フロントエンド用)
  rowIndex?: number; // スプレッドシートの行番号
  fileId?: string; // Google Drive File ID
  status?: 'pending' | 'verified'; // ステータス

  date: string;
  storeName: string;
  amount: number;
  items: string[];
  category: string; // 勘定科目
  confidence?: number;
  driveLink?: string; // Google Driveのリンク
  
  // インボイス・税計算用拡張フィールド
  invoiceNumber?: string; // T番号
  taxRate?: number; // 10 or 8
  taxExcluded?: number; // 税抜金額
  taxAmount?: number; // 消費税額
  
  // 家事按分・資産管理
  businessRatio?: number; // 事業割合 (0-100)
  deductibleAmount?: number; // 経費計上額
  isAsset?: boolean; // 資産計上フラグ
}

export interface AnalyzeResult {
  success: boolean;
  data?: ReceiptData;
  error?: string;
}

export enum UploadStatus {
  IDLE = 'idle',
  PREVIEW = 'preview',
  UPLOADING = 'uploading',
  EDITING = 'editing', // 編集・確認中ステータス
  REGISTERING = 'registering', // 記帳中
  SUCCESS = 'success',
  ERROR = 'error',
}

// ダッシュボード用データ型
export interface MonthlyData {
  month: string; // "2023-10"
  amount: number;
}

export interface CategoryData {
  name: string;
  value: number;
  color: string;
}

export interface DashboardData {
  totalAmount: number;
  monthlyData: MonthlyData[];
  categoryData: CategoryData[];
  recentReceipts: ReceiptData[];
}