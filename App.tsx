import React, { useState, useEffect } from 'react';
import { AppState, Category, Language, Transaction, TransactionType, BackupData } from './types';
import { DEFAULT_CATEGORIES, TRANSLATIONS, ICONS } from './constants';
import Dashboard from './components/Dashboard';
import TransactionList from './components/TransactionList';
import Settings from './components/Settings';
import Button from './components/Button';
import Login from './components/Login';
import { initGoogleDrive, handleDriveAuth, backupToDrive, restoreLatestFromDrive, getDriveUser } from './services/googleDrive';

// Initial State
const initialState: AppState = {
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  currency: 'USD',
};

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

  // Drive API State
  const [isDriveReady, setIsDriveReady] = useState(false);
  const [driveUser, setDriveUser] = useState<any>(null);
  const [driveLoading, setDriveLoading] = useState(false);
  const [backupMsg, setBackupMsg] = useState('');
  
  // Sync Modal State
  const [showSyncModal, setShowSyncModal] = useState(false);

  // --- Effects ---

  // 1. Initialize Google Drive Client
  useEffect(() => {
    if (isAuthenticated) {
        initGoogleDrive((inited) => {
            setIsDriveReady(inited);
            // Auto check user
            if (inited) {
               getDriveUser().then(user => {
                  if (user) setDriveUser(user);
               });
            }
        });
    }
  }, [isAuthenticated]);

  // 2. Local Storage Persistence
  useEffect(() => {
    localStorage.setItem('smartFinanceData', JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    localStorage.setItem('smartFinanceLang', lang);
  }, [lang]);

  useEffect(() => {
    const html = document.documentElement;
    if (isDark) {
      html.classList.add('dark');
      localStorage.setItem('smartFinanceTheme', 'dark');
    } else {
      html.classList.remove('dark');
      localStorage.setItem('smartFinanceTheme', 'light');
    }
  }, [isDark]);

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
    setDriveUser(null);
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
    
    setState(prev => {
        const newState = { ...prev, transactions: [newTransaction, ...prev.transactions] };
        return newState;
    });
    setShowTransactionModal(false);
  };

  const updateTransaction = (updatedT: Transaction) => {
    setState(prev => {
        const newState = {
            ...prev,
            transactions: prev.transactions.map(t => t.id === updatedT.id ? updatedT : t)
        };
        return newState;
    });
    setShowTransactionModal(false);
    setEditingTransaction(null);
  };

  const handleDeleteRequest = (id: string) => {
    requestSecureAction(() => {
         setState(prev => {
             const newState = { ...prev, transactions: prev.transactions.filter(t => t.id !== id) };
             return newState;
         });
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
    setState(prev => {
        const newState = { ...prev, categories: [...prev.categories, c] };
        return newState;
    });
  };

  const updateCategory = (updatedCat: Category) => {
    setState(prev => {
        const newState = { 
            ...prev, 
            categories: prev.categories.map(c => c.id === updatedCat.id ? updatedCat : c) 
        };
        return newState;
    });
  };

  const deleteCategory = (id: string) => {
     setState(prev => {
         const newState = { ...prev, categories: prev.categories.filter(c => c.id !== id) };
         return newState;
     });
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
        setState(importedState);
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
    setState(prev => {
        const newState = { ...prev, currency };
        return newState;
    });
  };

  // --- Drive Handlers ---
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

  const handleConnectDrive = async () => {
      if (!isDriveReady) {
          alert("Google Drive API not initialized. Check your internet or API keys.");
          return;
      }
      try {
          await handleDriveAuth();
          const user = await getDriveUser();
          setDriveUser(user);
      } catch (e: any) {
          console.error(e);
          if (e.error === 'popup_closed_by_user') return;
          alert("Failed to connect to Google Drive");
      }
  };

  const handleDriveBackup = async () => {
      setDriveLoading(true);
      setBackupMsg('');
      try {
          const backupData = prepareBackupData();
          await backupToDrive(backupData);
          setBackupMsg(t.backupSuccess[lang]);
          setTimeout(() => setBackupMsg(''), 3000);
      } catch (e) {
          console.error(e);
          alert("Backup failed. See console.");
      } finally {
          setDriveLoading(false);
      }
  };

  const handleDriveRestore = async () => {
      setDriveLoading(true);
      setBackupMsg('');
      try {
          const data = await restoreLatestFromDrive();
          if (data) {
              const success = handleImport(data);
              if (success) {
                 setBackupMsg(t.restoreSuccess[lang]);
              } else {
                 setBackupMsg("Format Error"); 
              }
          } else {
              setBackupMsg(t.noBackupFound[lang]);
          }
          setTimeout(() => setBackupMsg(''), 3000);
      } catch (e) {
          console.error(e);
          alert("Restore failed. See console.");
      } finally {
          setDriveLoading(false);
      }
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

  const SyncModal = () => {
      if (!showSyncModal) return null;

      return (
        <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
            <div className="bg-white dark:bg-slate-800 rounded-xl shadow-xl w-full max-w-sm overflow-hidden animate-fadeIn p-6">
                <div className="text-center mb-4">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mx-auto mb-2 text-blue-600 dark:text-blue-400">
                        <ICONS.Cloud size={24} />
                    </div>
                    <h3 className="font-bold text-lg text-slate-900 dark:text-white">{t.syncData[lang]}</h3>
                    <p className="text-sm text-slate-500 mt-2">{t.syncDesc[lang]}</p>
                </div>

                {!driveUser ? (
                    <div className="text-center">
                        <Button onClick={handleConnectDrive} className="w-full mb-2">
                             <img src="https://upload.wikimedia.org/wikipedia/commons/1/12/Google_Drive_icon_%282020%29.svg" alt="Drive" className="w-5 h-5 mr-2"/>
                             {t.connectDrive[lang]}
                        </Button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-2">{t.step1[lang]}</h4>
                            <Button 
                                onClick={handleDriveBackup} 
                                disabled={driveLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700"
                                icon={driveLoading ? <ICONS.RefreshCw className="animate-spin"/> : <ICONS.CloudUpload />}
                            >
                                {t.uploadToCloud[lang]}
                            </Button>
                        </div>
                        <div className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                            <h4 className="font-medium text-sm text-slate-700 dark:text-slate-300 mb-2">{t.step2[lang]}</h4>
                            <Button 
                                onClick={handleDriveRestore} 
                                disabled={driveLoading}
                                className="w-full bg-green-600 hover:bg-green-700"
                                icon={driveLoading ? <ICONS.RefreshCw className="animate-spin"/> : <ICONS.CloudDownload />}
                            >
                                {t.downloadFromCloud[lang]}
                            </Button>
                        </div>
                         {backupMsg && (
                            <p className={`text-sm text-center font-medium animate-fadeIn ${backupMsg === t.noBackupFound[lang] || backupMsg === "Format Error" ? 'text-red-500' : 'text-green-600'}`}>
                                {backupMsg}
                            </p>
                        )}
                    </div>
                )}
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
                    <Button variant="ghost" onClick={() => setShowSyncModal(false)} className="w-full">
                        {t.cancel[lang]}
                    </Button>
                </div>
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
      
      {/* Mobile Header */}
      <header className="md:hidden bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 p-4 sticky top-0 z-30 flex justify-between items-center">
        <h1 className="font-bold text-xl text-blue-600 dark:text-blue-400">HHS Finance</h1>
        <div className="flex items-center gap-2">
            <button
                onClick={() => setShowSyncModal(true)}
                className="bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 p-2 rounded-full hover:bg-slate-200"
            >
                <ICONS.Cloud size={20} />
            </button>
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
        <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-800 border-r border-slate-200 dark:border-slate-700 print:hidden">
            <div className="p-6">
                <h1 className="font-bold text-2xl text-blue-600 dark:text-blue-400 flex items-center gap-2">
                    <ICONS.Wallet /> HHS Finance
                </h1>
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
                <div className="pt-4 mt-4 border-t border-slate-100 dark:border-slate-700">
                    <button
                        onClick={() => setShowSyncModal(true)}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700"
                    >
                         <ICONS.Cloud size={20} /> {t.syncData[lang]}
                    </button>
                </div>
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
                  addCategory={addCategory}
                  updateCategory={updateCategory}
                  deleteCategory={deleteCategory}
                  setCurrency={setCurrency}
                  onLogout={handleLogout}
                  isDriveReady={isDriveReady}
                  driveUser={driveUser}
                  driveLoading={driveLoading}
                  backupMsg={backupMsg}
                  onConnectDrive={handleConnectDrive}
                  onDriveBackup={handleDriveBackup}
                  onDriveRestore={handleDriveRestore}
                />
             )}
          </div>
        </main>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 w-full bg-white dark:bg-slate-800 border-t border-slate-200 dark:border-slate-700 flex justify-around p-3 z-30 print:hidden safe-area-bottom">
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
      <SyncModal />
    </div>
  );
}

export default App;