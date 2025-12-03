
export type TransactionType = 'income' | 'expense';

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  isCustom?: boolean;
  color?: string;
}

export interface Transaction {
  id: string;
  date: string; // ISO string YYYY-MM-DD
  amount: number;
  type: TransactionType;
  categoryId: string;
  note: string;
}

export interface AppState {
  transactions: Transaction[];
  categories: Category[];
  currency: string;
}

export type Language = 'en' | 'my';

export interface Translation {
  [key: string]: {
    en: string;
    my: string;
  };
}

export interface BackupData {
  appState: AppState;
  settings: {
    lang: Language;
    isDark: boolean;
  };
  metadata: {
    version: string;
    timestamp: string;
    description: string;
  };
}

// Interface for the PWA install event
export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}
