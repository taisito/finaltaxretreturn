
// GAS Web App URL
// 環境変数 (VITE_GAS_WEB_APP_URL) からの読み込みを試みます。
// ローカル環境やVite以外の環境で import.meta.env が undefined の場合は
// エラーにならないようチェックし、デフォルトのURLを使用します。

const getEnvUrl = () => {
  try {
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      return import.meta.env.VITE_GAS_WEB_APP_URL;
    }
  } catch (e) {
    // ignore
  }
  return null;
};

// ここにハードコーディングされたURLをフォールバックとして設定します。
// Vercel等で環境変数を設定すれば、そちらが優先されます。
export const GAS_WEB_APP_URL = getEnvUrl() || "";

// 使用するGeminiモデル
// ユーザー指定により gemini-2.5-flash を使用します。
export const GEMINI_MODEL = 'gemini-2.5-flash';

// 勘定科目ごとのカラー設定
export const CATEGORY_COLORS: Record<string, string> = {
  '消耗品費': 'bg-blue-100 text-blue-800 border-blue-200',
  '旅費交通費': 'bg-green-100 text-green-800 border-green-200',
  '会議費': 'bg-purple-100 text-purple-800 border-purple-200',
  '交際費': 'bg-pink-100 text-pink-800 border-pink-200',
  '通信費': 'bg-cyan-100 text-cyan-800 border-cyan-200',
  '水道光熱費': 'bg-yellow-100 text-yellow-800 border-yellow-200',
  '新聞図書費': 'bg-indigo-100 text-indigo-800 border-indigo-200',
  '雑費': 'bg-gray-100 text-gray-800 border-gray-200',
  'default': 'bg-slate-100 text-slate-800 border-slate-200',
};

export const MAX_FILE_SIZE_MB = 10;
export const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/jpg'];
