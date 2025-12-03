
import React, { useState, useEffect } from 'react';
import { AppState, Category, Language, Transaction, TransactionType, BackupData } from './types';
import { DEFAULT_CATEGORIES, TRANSLATIONS, ICONS } from './constants';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import Settings from './components/Settings';
import Button from './components/Button';
import Login from './components/Login';
import PrintReport from './components/PrintReport';
import { saveToFirestore, subscribeToData, isFirebaseReady } from './services/firebase';

// Initial State
const initialState: AppState = {
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  currency: 'USD',
};

// Since we are using a shared "admin" login, we use a fixed ID for the database document
const DB_USER_ID = 'admin_default';

type View = 'dashboard' | 'transactions' | 'settings';

function App() {
  // --- State Management ---
  const [state, setState] = useState<AppState>(() => {
    const saved = localStorage.getItem('smartFinanceData');
    return saved ? JSON.parse(saved) : initialState;
  });

  const [lang, setLang] = useState<Language>(() => {
    return (localStorage.getItem('smartFinanceLang') as Language) || 'en';
  });

  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('smartFinanceTheme') === 'dark';
  });

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('smartFinance_auth') === 'true';
  });

  const [currentView, setCurrentView] = useState<View>('dashboard');
  
  // Transaction Modal State
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Password Confirmation State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordAction, setPasswordAction] = useState<{ fn: () => void } | null>(null);

  // Logout Confirmation Modal State
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  // Network Status State
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // --- Effects ---

  // 1. Local Storage Persistence & Firestore Subscription
  useEffect(() => {
    // Save language and theme settings
    localStorage.setItem('smartFinanceLang', lang);
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('smartFinanceTheme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('smartFinanceTheme', 'light');
    }
  }, [lang, isDark]);

  // 2. Database Subscription
  useEffect(() => {
    if (isAuthenticated && isFirebaseReady && isOnline) {
      // Subscribe to Firestore changes
      const unsubscribe = subscribeToData(DB_USER_ID, (cloudData) => {
        // Merge cloud data with local state structure to ensure validity
        setState(prev => ({
          ...prev,
          transactions: cloudData.transactions || [],
          categories: cloudData.categories || DEFAULT_CATEGORIES,
          currency: cloudData.currency || 'USD'
        }));
      });
      return () => unsubscribe();
    }
  }, [isAuthenticated, isOnline]);

  // 3. Network Listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // --- Helpers for Persistence ---
  // We use this to save to BOTH LocalStorage (offline) and Firestore (cloud)
  const persistState = (newState: AppState) => {
    setState(newState);
    localStorage.setItem('smartFinanceData', JSON.stringify(newState));
    if (isAuthenticated && isOnline) {
      saveToFirestore(DB_USER_ID, newState);
    }
  };

  // --- Handlers ---
  const handleLogin = (u: string, p: string) => {
    if (u === 'admin' && p === '1471656') {
      setIsAuthenticated(true);
      localStorage.setItem('smartFinance_auth', 'true');
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('smartFinance_auth');
    setCurrentView('dashboard');
    setShowLogoutModal(false);
  };

  // --- Backup & Logout Logic ---
  const prepareBackupData = (): BackupData => {
    return {
        appState: state,
        settings: {
            lang,
            isDark
        },
        metadata: {
            version: '1.1',
            timestamp: new Date().toISOString(),
            description: `Backup with ${state.transactions.length} transactions and ${state.categories.length} categories.`
        }
    };
  };

  const handleBackup = () => {
    try {
        const backupData = prepareBackupData();
        const dataStr = JSON.stringify(backupData, null, 2);
        const blob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `HHS_Finance_Backup_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (e) {
        console.error("Backup failed", e);
        alert("Failed to create backup file. Please try again.");
    }
  };

  const handleLogoutRequest = () => {
      setShowLogoutModal(true);
  };

  const confirmLogoutAndBackup = () => {
      // 1. Trigger Backup
      handleBackup();
      
      // 2. Delay logout slightly to allow file download to register
      setTimeout(() => {
          handleLogout();
      }, 500);
  };

  // Secure Action Wrapper
  const requestSecureAction = (action: () => void) => {
    setPasswordAction({ fn: action });
    setShowPasswordModal(true);
  };

  const verifyPassword = (password: string) => {
    if (password === '1471656') {
        if (passwordAction) {
            passwordAction.fn();
        }
        setShowPasswordModal(false);
        setPasswordAction(null);
        return true;
    }
    return false;
  };

  const addTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTransaction: Transaction = {
      ...t,
      id: Date.now().toString(),
    };
    
    const newState = { ...state, transactions: [newTransaction, ...state.transactions] };
    persistState(newState);
    setShowTransactionModal(false);
  };

  const updateTransaction = (updatedT: Transaction) => {
    const newState = {
        ...state,
        transactions: state.transactions.map(t => t.id === updatedT.id ? updatedT : t)
    };
    persistState(newState);
    setShowTransactionModal(false);
    setEditingTransaction(null);
  };

  const handleDeleteRequest = (id: string) => {
    requestSecureAction(() => {
         const newState = { ...state, transactions: state.transactions.filter(t => t.id !== id) };
         persistState(newState);
    });
  };

  const handleEditRequest = (t: Transaction) => {
    requestSecureAction(() => {
        setEditingTransaction(t);
        setShowTransactionModal(true);
    });
  };

  const openAddModal = () => {
      setEditingTransaction(null);
      setShowTransactionModal(true);
  };

  const addCategory = (c: Category) => {
    const newState = { ...state, categories: [...state.categories, c] };
    persistState(newState);
  };

  const updateCategory = (updatedCat: Category) => {
    const newState = { 
        ...state, 
        categories: state.categories.map(c => c.id === updatedCat.id ? updatedCat : c) 
    };
    persistState(newState);
  };

  const deleteCategory = (id: string) => {
     const newState = { ...state, categories: state.categories.filter(c => c.id !== id) };
     persistState(newState);
  };

  // Improved Import/Restore Handler
  const handleImport = (data: any) => {
    let importedState: AppState | null = null;
    let importedSettings: { lang: Language, isDark: boolean } | null = null;

    // Check Format 1: Full Backup (BackupData)
    if (data.appState && data.metadata) {
        console.log("Restoring from Full Backup:", data.metadata);
        importedState = data.appState;
        importedSettings = data.settings;
    } 
    // Check Format 2: Legacy Backup (AppState only)
    else if (data.transactions && data.categories) {
        console.log("Restoring from Legacy Backup");
        importedState = data as AppState;
    }

    // Apply State
    if (importedState && Array.isArray(importedState.transactions) && Array.isArray(importedState.categories)) {
        // We use persistState here to ensure the imported data is sent to DB immediately
        persistState(importedState);
    } else {
        console.error("Invalid data structure found during import");
        return false; // Failed
    }

    // Apply Settings (if available)
    if (importedSettings) {
        if (importedSettings.lang) setLang(importedSettings.lang);
        if (typeof importedSettings.isDark === 'boolean') setIsDark(importedSettings.isDark);
    }
    
    return true; // Success
  };

  const setCurrency = (currency: string) => {
    const newState = { ...state, currency };
    persistState(newState);
  };

  // --- Render Helpers ---
  const t = TRANSLATIONS;

  const TransactionModal = () => {
    const [amount, setAmount] = useState('');
    const [note, setNote] = useState('');
    const [type, setType] = useState<TransactionType>('expense');
    const [catId, setCatId] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

    useEffect(() => {
        if (editingTransaction) {
            setAmount(editingTransaction.amount.toString());
            setNote(editingTransaction.note);
            setType(editingTransaction.type);
            setCatId(editingTransaction.categoryId);
            setDate(editingTransaction.date);
        } else {
            setAmount('');
            setNote('');
            setType('expense');
            setCatId(state.categories[0].id);
            setDate(new Date().toISOString().split('T')[0]);
        }
    }, [editingTransaction, showTransactionModal]);

    if (!showTransactionModal) return null;

    const filteredCats = state.categories.filter(c => c.type === type);
    const currentCatId = filteredCats.find(c => c.id === catId)?.id || filteredCats[0]?.id;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || !currentCatId) return;

        if (editingTransaction) {
            updateTransaction({
                ...editingTransaction,
                amount: parseFloat(amount),
                note,
                type,
                categoryId: currentCatId,
                date
            });
        } else {
            addTransaction({
                amount: parseFloat(amount),
                note,
                type,
                categoryId: currentCatId,
                date
            });
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-fadeIn">
                <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                    <h3 className="font-bold text-lg dark:text-white">
                        {editingTransaction ? t.editTransaction[lang] : t.addTransaction[lang]}
                    </h3>
                    <button onClick={() => setShowTransactionModal(false)} className="text-slate-500 hover:text-slate-700 dark:text-slate-400">✕</button>
                </div>
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="flex gap-2 p-1 bg-slate-100 dark:bg-slate-700 rounded-lg">
                        <button 
                          type="button"
                          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${type === 'expense' ? 'bg-white dark:bg-slate-600 shadow text-red-600' : 'text-slate-500 dark:text-slate-400'}`}
                          onClick={() => setType('expense')}
                        >
                            {t.expense[lang]}
                        </button>
                        <button 
                          type="button"
                          className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${type === 'income' ? 'bg-white dark:bg-slate-600 shadow text-green-600' : 'text-slate-500 dark:text-slate-400'}`}
                          onClick={() => setType('income')}
                        >
                            {t.income[lang]}
                        </button>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.amount[lang]}</label>
                        <input 
                          type="number" 
                          required 
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={amount}
                          onChange={(e) => setAmount(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.category[lang]}</label>
                        <select 
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={currentCatId}
                          onChange={(e) => setCatId(e.target.value)}
                        >
                           {filteredCats.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.date[lang]}</label>
                        <input 
                          type="date" 
                          required
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={date}
                          onChange={(e) => setDate(e.target.value)}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.note[lang]}</label>
                        <input 
                          type="text" 
                          className="w-full px-3 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                        />
                    </div>

                    <div className="flex gap-3 mt-6">
                        <Button type="button" variant="secondary" onClick={() => setShowTransactionModal(false)} className="flex-1">
                            {t.cancel[lang]}
                        </Button>
                        <Button type="submit" className="flex-1">
                            {t.save[lang]}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
  };

  const LogoutConfirmModal = () => {
    if (!showLogoutModal) return null;

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-fadeIn p-6">
                <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-full flex items-center justify-center mx-auto mb-2 text-red-600 dark:text-red-400">
                        <ICONS.LogOut size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">
                        {lang === 'en' ? 'Log Out' : 'အကောင့်ထွက်ရန်'}
                    </h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                        {lang === 'en' 
                          ? 'Do you want to backup your data before logging out?' 
                          : 'အကောင့်မထွက်မီ ဒေတာများကို သိမ်းဆည်းလိုပါသလား?'}
                    </p>
                </div>
                
                <div className="flex flex-col gap-3">
                     <Button 
                        type="button" 
                        variant="primary" 
                        onClick={confirmLogoutAndBackup} 
                        className="w-full"
                    >
                        {lang === 'en' ? 'Backup & Log Out' : 'သိမ်းဆည်းပြီး ထွက်မည်'}
                    </Button>
                    
                     <Button 
                        type="button" 
                        variant="ghost" 
                        onClick={() => setShowLogoutModal(false)} 
                        className="w-full"
                    >
                        {t.cancel[lang]}
                    </Button>
                </div>
             </div>
        </div>
    );
  };

  const PasswordModal = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    if (!showPasswordModal) return null;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (verifyPassword(password)) {
            setPassword('');
            setError('');
        } else {
            setError(t.wrongPassword[lang]);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
             <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-fadeIn p-6">
                <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-2 text-blue-600 dark:text-blue-400">
                        <ICONS.Lock size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t.securityCheck[lang]}</h3>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">{t.enterPassword[lang]}</label>
                        <input 
                          type="password" 
                          autoFocus
                          className="w-full px-4 py-2 border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                        />
                        {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
                    </div>
                    <div className="flex gap-3">
                         <Button type="button" variant="secondary" onClick={() => setShowPasswordModal(false)} className="flex-1">
                            {t.cancel[lang]}
                        </Button>
                        <Button type="submit" className="flex-1">
                            {t.confirm[lang]}
                        </Button>
                    </div>
                </form>
             </div>
        </div>
    );
  };

  if (!isAuthenticated) {
    return (
      <Login 
        onLogin={handleLogin} 
        lang={lang} 
        toggleLang={() => setLang(l => l === 'en' ? 'my' : 'en')} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-200">
      
      {/* Offline Banner */}
      {!isOnline && (
        <div className="bg-slate-800 text-white text-xs py-1 text-center font-medium safe-area-top print-hidden">
            {lang === 'en' ? 'You are currently offline. Changes are saved locally.' : 'အင်တာနက်ပြတ်တောက်နေပါသည်။ အချက်အလက်များ ဖုန်းထဲတွင် သိမ်းဆည်းထားပါမည်။'}
        </div>
      )}

      {/* Screen View - Hidden on Print */}
      <div className="print-hidden">
          {/* Mobile Header */}
          <header className="md:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-30 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <h1 className="font-bold text-xl text-blue-600 dark:text-blue-400 flex items-center gap-2">
                  HHS Finance
                  {isFirebaseReady && isOnline && <div className="w-2 h-2 rounded-full bg-green-500"></div>}
                  {(!isOnline) && <div className="w-2 h-2 rounded-full bg-slate-400"></div>}
              </h1>
              <button 
                  type="button"
                  onClick={handleLogoutRequest} 
                  className="p-1 text-red-500 hover:bg-red-50 rounded dark:hover:bg-slate-700 transition-colors"
                  title={t.logout[lang]}
              >
                  <ICONS.LogOut size={18} />
              </button>
            </div>
            <div className="flex items-center gap-2">
                <button 
                    onClick={openAddModal}
                    className="bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 active:scale-95 transition-transform"
                >
                    <ICONS.Plus size={20} />
                </button>
            </div>
          </header>

          <div className="flex h-screen overflow-hidden">
            
            {/* Sidebar (Desktop) */}
            <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 print-hidden">
                <div className="p-6">
                    <h1 className="font-bold text-2xl text-blue-600 dark:text-blue-400 flex items-center gap-2">
                        <ICONS.Wallet /> HHS Finance
                        {isFirebaseReady && isOnline && <div className="w-2 h-2 rounded-full bg-green-500 ml-1" title="Cloud Sync Active"></div>}
                        {!isOnline && <div className="w-2 h-2 rounded-full bg-slate-400 ml-1" title="Offline"></div>}
                    </h1>
                    <button 
                        type="button"
                        onClick={handleLogoutRequest}
                        className="flex items-center gap-1.5 mt-2 text-sm text-red-500 hover:text-red-700 dark:hover:text-red-400 font-medium transition-colors"
                    >
                         <ICONS.LogOut size={14} /> {t.logout[lang]}
                    </button>
                </div>
                <nav className="flex-1 px-4 space-y-2">
                    <button 
                      onClick={() => setCurrentView('dashboard')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === 'dashboard' ? 'bg-blue-50 text-blue-600 dark:bg-slate-700 dark:text-blue-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        <ICONS.LayoutDashboard size={20} /> {t.dashboard[lang]}
                    </button>
                    <button 
                      onClick={() => setCurrentView('transactions')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === 'transactions' ? 'bg-blue-50 text-blue-600 dark:bg-slate-700 dark:text-blue-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        <ICONS.List size={20} /> {t.transactions[lang]}
                    </button>
                    <button 
                      onClick={() => setCurrentView('settings')}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${currentView === 'settings' ? 'bg-blue-50 text-blue-600 dark:bg-slate-700 dark:text-blue-400 font-medium' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700'}`}
                    >
                        <ICONS.SettingsIcon size={20} /> {t.settings[lang]}
                    </button>
                </nav>
                <div className="p-4">
                    <Button onClick={openAddModal} className="w-full gap-2 shadow-lg shadow-blue-500/30">
                        <ICONS.Plus size={18} /> {t.addTransaction[lang]}
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 overflow-auto p-4 md:p-8 relative scroll-smooth">
              <div className="max-w-6xl mx-auto pb-20 md:pb-0">
                {currentView === 'dashboard' && <Dashboard state={state} lang={lang} />}
                {currentView === 'transactions' && (
                    <TransactionList 
                        state={state} 
                        onDelete={handleDeleteRequest} 
                        onEdit={handleEditRequest} 
                        lang={lang} 
                    />
                )}
                {currentView === 'settings' && (
                    <Settings 
                      state={state} 
                      lang={lang} 
                      toggleLang={() => setLang(l => l === 'en' ? 'my' : 'en')}
                      isDark={isDark}
                      toggleTheme={() => setIsDark(d => !d)}
                      onImport={handleImport}
                      onBackup={handleBackup}
                      addCategory={addCategory}
                      updateCategory={updateCategory}
                      deleteCategory={deleteCategory}
                      setCurrency={setCurrency}
                      onLogout={handleLogoutRequest}
                    />
                )}
              </div>
            </main>
          </div>

          {/* Mobile Bottom Nav */}
          <nav className="md:hidden fixed bottom-0 w-full bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-around p-3 z-30 print-hidden safe-area-bottom">
            <button 
                onClick={() => setCurrentView('dashboard')}
                className={`flex flex-col items-center gap-1 ${currentView === 'dashboard' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
            >
                <ICONS.LayoutDashboard size={24} />
                <span className="text-[10px]">{t.dashboard[lang]}</span>
            </button>
            <button 
                onClick={() => setCurrentView('transactions')}
                className={`flex flex-col items-center gap-1 ${currentView === 'transactions' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
            >
                <ICONS.List size={24} />
                <span className="text-[10px]">{t.transactions[lang]}</span>
            </button>
            <button 
                onClick={() => setCurrentView('settings')}
                className={`flex flex-col items-center gap-1 ${currentView === 'settings' ? 'text-blue-600 dark:text-blue-400' : 'text-slate-500 dark:text-slate-400'}`}
            >
                <ICONS.SettingsIcon size={24} />
                <span className="text-[10px]">{t.settings[lang]}</span>
            </button>
          </nav>

          <TransactionModal />
          <PasswordModal />
          <LogoutConfirmModal />
      </div>

      {/* Print View - Visible Only on Print */}
      <div className="hidden print-visible">
          <PrintReport state={state} lang={lang} />
      </div>

    </div>
  );
}

export default App;
