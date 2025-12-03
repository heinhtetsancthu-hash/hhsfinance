import { Category, Translation } from './types';
import { 
  LayoutDashboard, 
  List, 
  Settings as SettingsIcon, 
  PieChart, 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Plus,
  Trash2,
  Save,
  Download,
  Upload,
  Printer,
  Moon,
  Sun,
  Globe,
  Sparkles,
  Search,
  Filter,
  Calendar,
  ChevronDown,
  LogOut,
  Pencil,
  Lock,
  Cloud,
  RefreshCw,
  CheckCircle,
  HardDrive,
  CloudUpload,
  CloudDownload,
  Share2,
  PiggyBank
} from 'lucide-react';

export const DEFAULT_CATEGORIES: Category[] = [
  // Income
  { id: 'c1', name: 'Salary', type: 'income', color: '#10b981' },
  { id: 'c2', name: 'Freelance', type: 'income', color: '#34d399' },
  { id: 'c7', name: 'Saving', type: 'income', color: '#2dd4bf' },
  { id: 'c8', name: 'Pine', type: 'income', color: '#ec4899' },
  { id: 'c9', name: 'Han', type: 'income', color: '#fb923c' },
  
  // Existing Expense
  { id: 'c3', name: 'Food', type: 'expense', color: '#f87171' },
  { id: 'c4', name: 'Transport', type: 'expense', color: '#fbbf24' },
  { id: 'c5', name: 'Utilities', type: 'expense', color: '#60a5fa' },
  { id: 'c6', name: 'Entertainment', type: 'expense', color: '#a78bfa' },

  // New Requested Expenses
  { id: 'c10', name: 'ဝန်ထမ်းလစာ', type: 'expense', color: '#ef4444' }, // Red
  { id: 'c11', name: 'ဈေးဖိုး', type: 'expense', color: '#f97316' }, // Orange
  { id: 'c12', name: 'Service_Sparepart', type: 'expense', color: '#84cc16' }, // Lime
  { id: 'c13', name: 'မီတာခ', type: 'expense', color: '#14b8a6' }, // Teal
  { id: 'c14', name: 'လျှပ်စစ်ပစ္စည်းဝယ်', type: 'expense', color: '#06b6d4' }, // Cyan
  { id: 'c15', name: 'တန်ဆာခ', type: 'expense', color: '#3b82f6' }, // Blue
  { id: 'c16', name: 'ခလေးမုန့်ဖိုး', type: 'expense', color: '#6366f1' }, // Indigo
  { id: 'c17', name: 'အလှပြင်ပစ္စည်းဝယ်', type: 'expense', color: '#8b5cf6' }, // Violet
  { id: 'c18', name: 'Accessories_Company', type: 'expense', color: '#d946ef' }, // Fuchsia
  { id: 'c19', name: 'Buy_Handset', type: 'expense', color: '#f43f5e' }, // Rose
  { id: 'c20', name: '‌‌ဆေးခန်း _‌ဆေးဝယ်', type: 'expense', color: '#ef4444' }, // Red
  { id: 'c21', name: 'အခွန်', type: 'expense', color: '#f59e0b' }, // Amber
  { id: 'c22', name: 'BuySecondHandset', type: 'expense', color: '#10b981' }, // Emerald
  { id: 'c23', name: 'မနက်စာ', type: 'expense', color: '#0ea5e9' }, // Sky
  { id: 'c24', name: 'လူမှု့ရေး', type: 'expense', color: '#818cf8' }, // Indigo-400
  { id: 'c25', name: 'အလှူခံ', type: 'expense', color: '#a855f7' }, // Purple
  { id: 'c26', name: 'ASM', type: 'expense', color: '#ec4899' }, // Pink
  { id: 'c27', name: 'B2B', type: 'expense', color: '#64748b' }, // Slate
  { id: 'c28', name: 'NweNweWin', type: 'expense', color: '#78716c' }, // Stone
  { id: 'c29', name: 'KoWaiYan', type: 'expense', color: '#dc2626' }, // Red-600
  { id: 'c30', name: 'MSN', type: 'expense', color: '#ea580c' }, // Orange-600
  { id: 'c31', name: 'Popular_Cover', type: 'expense', color: '#d97706' }, // Amber-600
  { id: 'c32', name: 'HOCO', type: 'expense', color: '#65a30d' }, // Lime-600
  { id: 'c33', name: 'REMAX', type: 'expense', color: '#059669' }, // Emerald-600
  { id: 'c34', name: 'SKY_HELDEN', type: 'expense', color: '#0891b2' }, // Cyan-600
  { id: 'c35', name: 'KS', type: 'expense', color: '#2563eb' }, // Blue-600
  { id: 'c36', name: 'OoPoppi', type: 'expense', color: '#4f46e5' }, // Indigo-600
  { id: 'c37', name: 'Daw_Khan_Yin', type: 'expense', color: '#7c3aed' }, // Violet-600
  { id: 'c38', name: 'ဆီဖိုး', type: 'expense', color: '#c026d3' }, // Fuchsia-600
  { id: 'c39', name: 'စာ‌ရေးကိရိယာ', type: 'expense', color: '#db2777' }, // Pink-600
  { id: 'c40', name: '‌‌‌ရေဘူး', type: 'expense', color: '#e11d48' }, // Rose-600
  { id: 'c41', name: 'K_PAY', type: 'expense', color: '#f87171' }, // Red-400
  { id: 'c42', name: 'ချိုရည်', type: 'expense', color: '#fbbf24' }, // Amber-400
  { id: 'c43', name: 'ကျူရှင်လခ', type: 'expense', color: '#4ade80' }, // Green-400
  { id: 'c44', name: 'Wifi', type: 'expense', color: '#60a5fa' }, // Blue-400
];

export const CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar' },
  { code: 'MMK', symbol: 'Ks', name: 'Myanmar Kyat' },
  { code: 'EUR', symbol: '€', name: 'Euro' },
  { code: 'GBP', symbol: '£', name: 'British Pound' },
  { code: 'SGD', symbol: 'S$', name: 'Singapore Dollar' },
  { code: 'THB', symbol: '฿', name: 'Thai Baht' }
];

export const TRANSLATIONS: Translation = {
  dashboard: { en: 'Dashboard', my: 'ဒက်ရှ်ဘုတ်' },
  transactions: { en: 'Transactions', my: 'ငွေစာရင်းများ' },
  settings: { en: 'Settings', my: 'ဆက်တင်များ' },
  totalIncome: { en: 'Total Income', my: 'စုစုပေါင်း ဝင်ငွေ' },
  totalExpense: { en: 'Total Expense', my: 'စုစုပေါင်း ထွက်ငွေ' },
  balance: { en: 'Balance', my: 'လက်ကျန်ငွေ' },
  totalSaving: { en: 'Total Savings', my: 'စုစုပေါင်း စုငွေ' },
  addTransaction: { en: 'Add Transaction', my: 'စာရင်းအသစ်ထည့်ရန်' },
  save: { en: 'Save', my: 'သိမ်းဆည်းပါ' },
  cancel: { en: 'Cancel', my: 'မလုပ်တော့ပါ' },
  delete: { en: 'Delete', my: 'ဖျက်ပါ' },
  edit: { en: 'Edit', my: 'ပြင်ဆင်ပါ' },
  date: { en: 'Date', my: 'နေ့စွဲ' },
  amount: { en: 'Amount', my: 'ပမာဏ' },
  category: { en: 'Category', my: 'အမျိုးအစား' },
  note: { en: 'Note', my: 'မှတ်ချက်' },
  type: { en: 'Type', my: 'အမျိုးအစား' },
  income: { en: 'Income', my: 'ဝင်ငွေ' },
  expense: { en: 'Expense', my: 'ထွက်ငွေ' },
  search: { en: 'Search...', my: 'ရှာဖွေရန်...' },
  filterByDate: { en: 'Filter by Date', my: 'နေ့စွဲဖြင့် ရှာပါ' },
  allCategories: { en: 'All Categories', my: 'အမျိုးအစားအားလုံး' },
  appearance: { en: 'Appearance', my: 'အသွင်အပြင်' },
  darkMode: { en: 'Dark Mode', my: 'အမှောင်စနစ်' },
  language: { en: 'Language', my: 'ဘာသာစကား' },
  currency: { en: 'Currency', my: 'ငွေကြေး' },
  dataManagement: { en: 'Data Management', my: 'ဒေတာ စီမံခန့်ခွဲမှု' },
  backupData: { en: 'Backup to File', my: 'ဖိုင်အဖြစ် သိမ်းဆည်းရန်' },
  restoreData: { en: 'Restore from File', my: 'ဖိုင်မှ ပြန်ယူရန်' },
  manageCategories: { en: 'Manage Categories', my: 'အမျိုးအစားများ စီမံရန်' },
  addCategory: { en: 'Add Category', my: 'အမျိုးအစားအသစ် ထည့်ရန်' },
  customCategories: { en: 'Custom Categories', my: 'စိတ်ကြိုက် အမျိုးအစားများ' },
  aiInsights: { en: 'AI Insights', my: 'AI အကြံပြုချက်' },
  aiAnalyze: { en: 'Analyze Finances', my: 'ငွေကြေး သုံးသပ်ရန်' },
  aiLoading: { en: 'Analyzing...', my: 'သုံးသပ်နေသည်...' },
  noTransactions: { en: 'No transactions found', my: 'စာရင်းများ မရှိပါ' },
  recentTransactions: { en: 'Recent Transactions', my: 'လတ်တလော စာရင်းများ' },
  today: { en: 'Today', my: 'ယနေ့' },
  timeFilter: { en: 'Period', my: 'အချိန်ကာလ' },
  day: { en: 'Day', my: 'နေ့' },
  week: { en: 'Week', my: 'အပတ်' },
  month: { en: 'Month', my: 'လ' },
  allTime: { en: 'All Time', my: 'အားလုံး' },
  dateRange: { en: 'Range', my: 'အပိုင်းအခြား' },
  startDate: { en: 'Start', my: 'စရက်' },
  endDate: { en: 'End', my: 'ဆုံးရက်' },
  totalFiltered: { en: 'Result Total', my: 'ရှာဖွေတွေ့ရှိငွေပမာဏ' },
  netBalance: { en: 'Net', my: 'လက်ကျန်' },
  logout: { en: 'Log Out', my: 'အကောင့်ထွက်ရန်' },
  username: { en: 'Username', my: 'အသုံးပြုသူအမည်' },
  password: { en: 'Password', my: 'စကားဝှက်' },
  login: { en: 'Login', my: 'အကောင့်ဝင်ရန်' },
  invalidCredentials: { en: 'Invalid username or password', my: 'အသုံးပြုသူအမည် (သို့) စကားဝှက် မှားယွင်းနေပါသည်' },
  welcomeBack: { en: 'Welcome Back', my: 'ကြိုဆိုပါတယ်' },
  enterPassword: { en: 'Enter Password', my: 'စကားဝှက်ရိုက်ထည့်ပါ' },
  confirm: { en: 'Confirm', my: 'အတည်ပြုပါ' },
  wrongPassword: { en: 'Incorrect Password', my: 'စကားဝှက်မှားယွင်းနေပါသည်' },
  editTransaction: { en: 'Edit Transaction', my: 'စာရင်းပြင်ဆင်ရန်' },
  deleteConfirm: { en: 'Delete Transaction?', my: 'စာရင်းဖျက်ရန် သေချာပါသလား' },
  deleteCategoryConfirm: { en: 'Delete this category?', my: 'ဤအမျိုးအစားကို ဖျက်မည်လား' },
  pickColor: { en: 'Color', my: 'အရောင်' },
  securityCheck: { en: 'Security Check', my: 'လုံခြုံရေး စစ်ဆေးခြင်း' }
};

export const ICONS = {
  LayoutDashboard,
  List,
  SettingsIcon,
  PieChart,
  Wallet,
  ArrowUpCircle,
  ArrowDownCircle,
  Plus,
  Trash2,
  Save,
  Download,
  Upload,
  Printer,
  Moon,
  Sun,
  Globe,
  Sparkles,
  Search,
  Filter,
  Calendar,
  ChevronDown,
  LogOut,
  Pencil,
  Lock,
  Cloud,
  RefreshCw,
  CheckCircle,
  HardDrive,
  CloudUpload,
  CloudDownload,
  Share2,
  PiggyBank
};