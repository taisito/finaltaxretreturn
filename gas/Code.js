
// --- CONFIGURATION ---
// 以下の値はスクリプトプロパティ(Project Settings > Script Properties)に設定することを推奨します
// 直接コードに書く場合は、取り扱いに注意してください。
const PROPS = PropertiesService.getScriptProperties();
const GEMINI_API_KEY = PROPS.getProperty('GEMINI_API_KEY'); 
const INPUT_FOLDER_ID = PROPS.getProperty('INPUT_FOLDER_ID');
const PROCESSED_FOLDER_ID = PROPS.getProperty('PROCESSED_FOLDER_ID');
const SPREADSHEET_ID = PROPS.getProperty('SPREADSHEET_ID'); 
// 認証用トークン (フロントエンドと同じ値を設定してください)
const API_TOKEN = PROPS.getProperty('API_TOKEN');

const MODEL_NAME = 'gemini-2.5-flash';

// --- TRIGGER SETUP ---

/**
 * 【実行用】定期実行トリガーをセットアップする関数
 * これを実行すると、10分ごとに `scanDriveFolder` が自動実行されるようになります。
 */
function setupTrigger() {
  clearTriggers(); // 重複防止のため既存のトリガーを削除
  
  ScriptApp.newTrigger('scanDriveFolder')
    .timeBased()
    .everyMinutes(10)
    .create();
    
  console.log('✅ トリガーを設定しました: scanDriveFolder (10分間隔)');
}

/**
 * 【実行用】定期実行トリガーを解除する関数
 */
function clearTriggers() {
  const triggers = ScriptApp.getProjectTriggers();
  let count = 0;
  for (const trigger of triggers) {
    if (trigger.getHandlerFunction() === 'scanDriveFolder') {
      ScriptApp.deleteTrigger(trigger);
      count++;
    }
  }
  console.log(`🗑️ ${count} 件のトリガーを削除しました`);
}

// --- DEBUG & TEST FUNCTIONS ---

/**
 * 【設定確認用】
 * スクリプトプロパティやフォルダアクセス権限が正しく設定されているか確認します。
 */
function debugSetup() {
  console.log("=== 設定確認開始 ===");
  
  // 1. API KEY
  if (GEMINI_API_KEY) console.log("[OK] GEMINI_API_KEY");
  else console.error("[NG] GEMINI_API_KEY: 未設定");

  // 2. API TOKEN
  if (API_TOKEN) console.log("[OK] API_TOKEN: 設定済み");
  else console.warn("[WARN] API_TOKEN: 未設定（セキュリティリスクあり）");

  // 3. Folders
  try {
    if (INPUT_FOLDER_ID) {
      const f = DriveApp.getFolderById(INPUT_FOLDER_ID);
      console.log(`[OK] INPUT_FOLDER: ${f.getName()} (アクセス可能)`);
    } else {
      console.error("[NG] INPUT_FOLDER_ID: 未設定");
    }
  } catch (e) {
    console.error(`[NG] INPUT_FOLDER_ID: ${e.message}`);
  }

  try {
    if (PROCESSED_FOLDER_ID) {
      const f = DriveApp.getFolderById(PROCESSED_FOLDER_ID);
      console.log(`[OK] PROCESSED_FOLDER: ${f.getName()} (アクセス可能)`);
    } else {
      console.error("[NG] PROCESSED_FOLDER_ID: 未設定");
    }
  } catch (e) {
    console.error(`[NG] PROCESSED_FOLDER_ID: ${e.message}`);
  }

  // 4. Spreadsheet
  try {
    const sheet = getSheet();
    console.log(`[OK] Spreadsheet: シート「${sheet.getName()}」にアクセス可能`);
  } catch (e) {
    console.error(`[NG] Spreadsheet: ${e.message}`);
  }

  console.log("=== 確認終了 ===");
}

/**
 * 【APIテスト用】
 */
function testDoPost() {
  console.log("🧪 テスト実行: Dashboardデータ取得リクエスト");
  
  const mockEvent = {
    postData: {
      contents: JSON.stringify({
        action: 'dashboard',
        token: API_TOKEN // テスト時もトークンが必要
      })
    }
  };
  
  try {
    const output = doPost(mockEvent);
    console.log("✅ レスポンスを受け取りました");
    console.log(output.getContent());
  } catch (e) {
    console.error("❌ エラー:", e.message);
  }
}

// --- MAIN ENDPOINT ---

function doPost(e) {
  try {
    if (!e || !e.postData) {
      throw new Error('No postData received.');
    }

    const json = JSON.parse(e.postData.contents);
    
    // --- SECURITY CHECK: API TOKEN ---
    // スクリプトプロパティに API_TOKEN が設定されている場合のみチェック
    if (API_TOKEN && json.token !== API_TOKEN) {
      throw new Error('Unauthorized: Invalid API Token');
    }

    const action = json.action;
    let result = {};

    switch (action) {
      case 'analyze':
        result = analyzeImage(json.image, json.mimeType);
        break;
      case 'register':
        result = addToSheet(json.data, 'verified');
        break;
      case 'approve':
        result = updateRow(json.data);
        break;
      case 'get_pending':
        result = getPendingItems();
        break;
      case 'scan_folder':
        result = scanDriveFolder();
        break;
      case 'dashboard':
        result = getDashboardData();
        break;
      default:
        throw new Error(`Invalid action: ${action}`);
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      data: result,
      count: result.count
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    console.error("doPost Error: " + error.toString());
    
    // エラー詳細を返しすぎない（セキュリティ対策）
    const errorMessage = error.message.includes('Unauthorized') 
      ? 'Unauthorized' 
      : error.toString();

    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: errorMessage
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

// --- CORE FUNCTIONS ---

/**
 * 画像をGeminiで解析する
 */
function analyzeImage(base64Image, mimeType) {
  if (!GEMINI_API_KEY) throw new Error('GEMINI_API_KEY is not set');

  // 画像サイズチェック（簡易的: Base64の長さで判断）
  // 10MB以上は弾く (約14,000,000文字)
  if (base64Image.length > 14000000) {
    throw new Error('Image size too large');
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL_NAME}:generateContent?key=${GEMINI_API_KEY}`;
  
  const payload = {
    contents: [{
      parts: [
        { text: "この領収書または請求書の画像を解析し、以下のJSON形式でデータを出力してください。項目が見つからない場合はnullまたは空配列にしてください。\n\nExpected JSON Format:\n{\n  \"date\": \"YYYY-MM-DD\",\n  \"storeName\": \"店舗名\",\n  \"amount\": 数値(税込合計),\n  \"items\": [\"品目1\", \"品目2\"],\n  \"category\": \"勘定科目(消耗品費, 旅費交通費, 会議費, 交際費, 通信費, 水道光熱費, 新聞図書費, 修繕費, 雑費, 工具器具備品, 地代家賃, 車両費 から選択)\",\n  \"invoiceNumber\": \"Tから始まる13桁の番号\",\n  \"taxRate\": 税率(10または8),\n  \"taxExcluded\": 税抜金額,\n  \"taxAmount\": 税額\n}" },
        {
          inline_data: {
            mime_type: mimeType,
            data: base64Image
          }
        }
      ]
    }],
    generationConfig: {
      response_mime_type: "application/json"
    }
  };

  const options = {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  const response = UrlFetchApp.fetch(url, options);
  
  if (response.getResponseCode() !== 200) {
    throw new Error(`Gemini API Error: ${response.getContentText()}`);
  }

  const json = JSON.parse(response.getContentText());
  
  if (!json.candidates || json.candidates.length === 0) {
    throw new Error('No candidates returned from Gemini API');
  }

  const text = json.candidates[0].content.parts[0].text;
  let data;
  try {
    data = JSON.parse(text);
  } catch (e) {
    const cleanedText = text.replace(/```json/g, '').replace(/```/g, '');
    data = JSON.parse(cleanedText);
  }

  // ビジネスロジック補正
  if (!data.taxAmount && data.amount && data.taxRate) {
    data.taxExcluded = Math.round(data.amount / (1 + data.taxRate / 100));
    data.taxAmount = data.amount - data.taxExcluded;
  }
  
  data.businessRatio = 100;
  data.deductibleAmount = data.amount;
  data.isAsset = data.amount >= 100000;

  return data;
}

/**
 * Driveフォルダをスキャン
 */
function scanDriveFolder() {
  if (!INPUT_FOLDER_ID) throw new Error('INPUT_FOLDER_ID is not set');
  if (!PROCESSED_FOLDER_ID) throw new Error('PROCESSED_FOLDER_ID is not set');

  let inputFolder, processedFolder;
  try {
    inputFolder = DriveApp.getFolderById(INPUT_FOLDER_ID);
    processedFolder = DriveApp.getFolderById(PROCESSED_FOLDER_ID);
  } catch (e) {
    throw new Error(`Invalid Folder ID: ${e.message}`);
  }

  const files = inputFolder.getFiles();
  let count = 0;
  const MAX_PROCESS = 3;

  while (files.hasNext() && count < MAX_PROCESS) {
    const file = files.next();
    const mimeType = file.getMimeType();
    
    if (mimeType.includes('image/')) {
      try {
        const base64 = Utilities.base64Encode(file.getBlob().getBytes());
        const analysis = analyzeImage(base64, mimeType);
        analysis.fileId = file.getId();
        analysis.driveLink = file.getUrl();
        
        addToSheet(analysis, 'pending');
        file.moveTo(processedFolder);
        count++;
      } catch (e) {
        console.error(`Failed to process ${file.getName()}: ${e.message}`);
      }
    }
  }
  return { count: count };
}

/**
 * 未承認アイテム取得
 */
function getPendingItems() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0];
  const pendingItems = [];
  const colMap = {};
  headers.forEach((h, i) => colMap[h] = i);

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row[colMap['Status']] === 'pending') {
      pendingItems.push(rowToObj(row, colMap, i + 1));
    }
  }
  return pendingItems;
}

/**
 * シートへの追加 (サニタイズ処理付き)
 */
function addToSheet(data, status) {
  const sheet = getSheet();
  const id = Utilities.getUuid();
  
  const rowData = [
    id,
    sanitize(data.date || ''),
    sanitize(data.storeName || ''),
    Number(data.amount || 0),
    sanitize(data.category || ''),
    JSON.stringify(data.items || []), // JSON文字列化は安全
    sanitize(status),
    sanitize(data.invoiceNumber || ''),
    Number(data.taxRate || 10),
    Number(data.taxExcluded || 0),
    Number(data.taxAmount || 0),
    Number(data.businessRatio || 100),
    Number(data.deductibleAmount || data.amount || 0),
    data.isAsset ? true : false,
    sanitize(data.fileId || ''),
    sanitize(data.driveLink || ''),
    new Date()
  ];
  
  sheet.appendRow(rowData);
  return { id: id };
}

/**
 * 行の更新
 */
function updateRow(data) {
  const sheet = getSheet();
  const rowIndex = data.rowIndex;
  
  if (!rowIndex || rowIndex < 2) throw new Error('Invalid row index');

  const headers = getHeaders(sheet);
  const colMap = {};
  headers.forEach((h, i) => colMap[h] = i);

  // サニタイズしながらセット
  sheet.getRange(rowIndex, colMap['Date'] + 1).setValue(sanitize(data.date));
  sheet.getRange(rowIndex, colMap['StoreName'] + 1).setValue(sanitize(data.storeName));
  sheet.getRange(rowIndex, colMap['Amount'] + 1).setValue(Number(data.amount));
  sheet.getRange(rowIndex, colMap['Category'] + 1).setValue(sanitize(data.category));
  sheet.getRange(rowIndex, colMap['Items'] + 1).setValue(JSON.stringify(data.items));
  sheet.getRange(rowIndex, colMap['Status'] + 1).setValue('verified');
  sheet.getRange(rowIndex, colMap['InvoiceNumber'] + 1).setValue(sanitize(data.invoiceNumber));
  sheet.getRange(rowIndex, colMap['TaxRate'] + 1).setValue(Number(data.taxRate));
  sheet.getRange(rowIndex, colMap['TaxExcluded'] + 1).setValue(Number(data.taxExcluded));
  sheet.getRange(rowIndex, colMap['TaxAmount'] + 1).setValue(Number(data.taxAmount));
  sheet.getRange(rowIndex, colMap['BusinessRatio'] + 1).setValue(Number(data.businessRatio));
  sheet.getRange(rowIndex, colMap['DeductibleAmount'] + 1).setValue(Number(data.deductibleAmount));
  sheet.getRange(rowIndex, colMap['IsAsset'] + 1).setValue(Boolean(data.isAsset));

  return { success: true };
}

function getDashboardData() {
  const sheet = getSheet();
  const data = sheet.getDataRange().getValues();
  const headers = data[0];
  const colMap = {};
  headers.forEach((h, i) => colMap[h] = i);

  let totalAmount = 0;
  const monthlyDataObj = {};
  const categoryDataObj = {};
  const recentReceipts = [];

  for (let i = data.length - 1; i >= 1; i--) {
    const row = data[i];
    if (row[colMap['Status']] !== 'verified') continue;

    const amount = Number(row[colMap['DeductibleAmount']] || row[colMap['Amount']] || 0);
    const dateStr = row[colMap['Date']];
    const category = row[colMap['Category']];
    
    totalAmount += amount;

    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      const monthKey = Utilities.formatDate(date, Session.getScriptTimeZone(), "yyyy-MM");
      monthlyDataObj[monthKey] = (monthlyDataObj[monthKey] || 0) + amount;
    }
    categoryDataObj[category] = (categoryDataObj[category] || 0) + amount;

    if (recentReceipts.length < 5) {
      recentReceipts.push(rowToObj(row, colMap, i + 1));
    }
  }

  const monthlyData = Object.keys(monthlyDataObj).sort().map(key => ({
    month: key, amount: monthlyDataObj[key]
  }));
  const categoryData = Object.keys(categoryDataObj).map(key => ({
    name: key, value: categoryDataObj[key], color: getColorForCategory(key)
  }));

  return { totalAmount, monthlyData, categoryData, recentReceipts };
}

// --- HELPERS & SECURITY UTILS ---

/**
 * スプレッドシートインジェクション対策
 * セルの値が数式として解釈される文字で始まる場合、エスケープする
 */
function sanitize(value) {
  if (typeof value !== 'string') return value;
  // =, +, -, @ で始まる文字列は危険な可能性があるためシングルクォートでエスケープ
  if (/^[=+\-@]/.test(value)) {
    return "'" + value;
  }
  return value;
}

function getSheet() {
  let ss;
  if (SPREADSHEET_ID) {
    try {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      console.error(e.message);
    }
  }
  if (!ss) {
    try {
      ss = SpreadsheetApp.getActiveSpreadsheet();
    } catch(e) {
      throw new Error("Spreadsheet not found.");
    }
  }
  let sheet = ss.getSheetByName('Receipts');
  if (!sheet) {
    sheet = ss.insertSheet('Receipts');
    sheet.appendRow([
      'ID', 'Date', 'StoreName', 'Amount', 'Category', 'Items', 'Status', 
      'InvoiceNumber', 'TaxRate', 'TaxExcluded', 'TaxAmount', 
      'BusinessRatio', 'DeductibleAmount', 'IsAsset', 'FileId', 'DriveLink', 'Timestamp'
    ]);
  }
  return sheet;
}

function getHeaders(sheet) {
  return sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
}

function rowToObj(row, colMap, rowIndex) {
  return {
    id: row[colMap['ID']],
    rowIndex: rowIndex,
    date: formatDate(row[colMap['Date']]),
    storeName: row[colMap['StoreName']],
    amount: Number(row[colMap['Amount']]),
    category: row[colMap['Category']],
    items: parseJSON(row[colMap['Items']]),
    status: row[colMap['Status']],
    invoiceNumber: row[colMap['InvoiceNumber']],
    taxRate: Number(row[colMap['TaxRate']]),
    taxExcluded: Number(row[colMap['TaxExcluded']]),
    taxAmount: Number(row[colMap['TaxAmount']]),
    businessRatio: Number(row[colMap['BusinessRatio']]),
    deductibleAmount: Number(row[colMap['DeductibleAmount']]),
    isAsset: Boolean(row[colMap['IsAsset']]),
    fileId: row[colMap['FileId']],
    driveLink: row[colMap['DriveLink']]
  };
}

function parseJSON(str) {
  try { return JSON.parse(str); } catch (e) { return []; }
}

function formatDate(dateVal) {
  if (dateVal instanceof Date) {
    return Utilities.formatDate(dateVal, Session.getScriptTimeZone(), "yyyy-MM-dd");
  }
  return dateVal;
}

function getColorForCategory(cat) {
  const colors = {
    '消耗品費': '#3b82f6', '旅費交通費': '#10b981', '会議費': '#8b5cf6',
    '交際費': '#ec4899', '通信費': '#06b6d4', '水道光熱費': '#eab308',
    '新聞図書費': '#6366f1', '雑費': '#64748b'
  };
  return colors[cat] || '#94a3b8';
}
