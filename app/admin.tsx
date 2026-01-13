import React, { useState, useEffect } from 'react';
import { toast } from '../components/ui/sonner';
import { router } from 'expo-router';
import { Search, RefreshCcw, Trash2, LogOut, Users, Key, Globe, DollarSign, LayoutGrid, Plus } from 'lucide-react';
import {
  getAllOTPCodes, getAllUserProfiles, deleteOTPCode, makeUserAdmin, removeAdminStatus, OTPCode, UserProfile,
  getGlobalCategories, createGlobalCategory, deleteGlobalCategory,
  getLanguages, addLanguage, deleteLanguage,
  getCurrencies, addCurrency, deleteCurrency
} from '../services/adminService';
import { DEFAULT_CURRENCIES } from './admin/defaultCurrencies';
import { logout } from '../services/authService';
import { useAuth } from '../contexts/AuthContext';

const Admin: React.FC = () => {
  const { isAdminUser, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  // Data States
  const [otpCodes, setOtpCodes] = useState<OTPCode[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [languages, setLanguages] = useState<any[]>([]);
  const [currencies, setCurrencies] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [showDialog, setShowDialog] = useState<string | null>(null);
  const [newItem, setNewItem] = useState<any>({});

  useEffect(() => {
    if (!authLoading) {
      if (!isAdminUser) {
        toast.error('Access denied. Admin privileges required.');
        router.replace('/');
        return;
      }
      loadData();
    }
  }, [isAdminUser, authLoading]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [otpData, userData, catData, langData, currData] = await Promise.all([
        getAllOTPCodes(),
        getAllUserProfiles(),
        getGlobalCategories(),
        getLanguages(),
        getCurrencies()
      ]);
      setOtpCodes(otpData);
      setUserProfiles(userData);
      setCategories(catData);
      setLanguages(langData);
      setCurrencies(currData);
    } catch (error) {
      console.error(error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    router.replace('/login');
  };

  const handleDeleteOTP = async (id: string) => {
    if (await deleteOTPCode(id)) {
      toast.success('OTP code deleted');
      loadData();
    }
  };

  const handleMakeAdmin = async (userId: string) => {
    if (await makeUserAdmin(userId)) {
      toast.success('User is now an admin');
      loadData();
    }
  };

  const handleRemoveAdmin = async (userId: string) => {
    if (await removeAdminStatus(userId)) {
      toast.success('Admin status removed');
      loadData();
    }
  };

  const handleCreate = async (type: 'category' | 'language' | 'currency') => {
    try {
      if (type === 'category') {
        await createGlobalCategory(newItem.name, newItem.icon || 'HelpCircle', newItem.color || '#64748b');
      } else if (type === 'language') {
        await addLanguage(newItem.code, newItem.name, newItem.icon || '🏳️');
      } else if (type === 'currency') {
        await addCurrency(newItem.code, newItem.name, newItem.symbol, newItem.icon || '💰');
      }
      toast.success(`${type} created`);
      setNewItem({});
      setShowDialog(null);
      loadData();
    } catch (e: any) {
      toast.error(`Failed: ${e.message}`);
    }
  };

  const handleDelete = async (type: 'category' | 'language' | 'currency', id: string) => {
    try {
      if (type === 'category') await deleteGlobalCategory(id);
      else if (type === 'language') await deleteLanguage(id);
      else if (type === 'currency') await deleteCurrency(id);

      toast.success('Deleted successfully');
      loadData();
    } catch (e: any) {
      toast.error(`Delete failed: ${e.message}`);
    }
  };

  const handleSeedCurrencies = async () => {
    setLoading(true);
    try {
      let count = 0;
      for (const curr of DEFAULT_CURRENCIES) {
        // Check if already exists to avoid duplicates (though DB has UNIQUE constraint)
        const exists = currencies.some(c => c.code === curr.code);
        if (!exists) {
          await addCurrency(curr.code, curr.name, curr.symbol, curr.icon || '💰');
          count++;
        }
      }
      toast.success(`Successfully added ${count} new currencies`);
      loadData();
    } catch (e: any) {
      toast.error(`Seeding failed: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || !isAdminUser) return null;

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

      {/* Sidebar */}
      <div style={{ width: '280px', backgroundColor: '#fff', borderRight: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '32px', color: '#0f172a' }}>Admin Panel</h1>

        <button onClick={() => setActiveTab('overview')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'overview' ? '#0f172a' : 'transparent', color: activeTab === 'overview' ? '#fff' : '#64748b', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s' }}>
          <Users size={18} /> Users & OTP
        </button>

        <button onClick={() => setActiveTab('categories')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'categories' ? '#0f172a' : 'transparent', color: activeTab === 'categories' ? '#fff' : '#64748b', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s' }}>
          <LayoutGrid size={18} /> Global Categories
        </button>

        <button onClick={() => setActiveTab('languages')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'languages' ? '#0f172a' : 'transparent', color: activeTab === 'languages' ? '#fff' : '#64748b', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s' }}>
          <Globe size={18} /> Languages
        </button>

        <button onClick={() => setActiveTab('currencies')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', border: 'none', backgroundColor: activeTab === 'currencies' ? '#0f172a' : 'transparent', color: activeTab === 'currencies' ? '#fff' : '#64748b', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s' }}>
          <DollarSign size={18} /> Currencies
        </button>

        <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '16px 0' }} />

        <button onClick={() => router.push('/admin/ml-dashboard')} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.2s' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
            <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
            <line x1="12" y1="22.08" x2="12" y2="12" />
          </svg>
          ML Dashboard
        </button>

        <div style={{ marginTop: 'auto' }}>
          <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'transparent', color: '#ef4444', cursor: 'pointer', fontSize: '14px', fontWeight: '500', width: '100%' }}>
            <LogOut size={18} /> Sign Out
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', textTransform: 'capitalize', color: '#0f172a' }}>{activeTab}</h2>
          <button onClick={loadData} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {/* OTP Codes Card */}
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#0f172a' }}>One-Time Passwords</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Phone</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Code</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {otpCodes.slice(0, 10).map(c => (
                    <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#0f172a' }}>{c.phone}</td>
                      <td style={{ padding: '12px', fontSize: '14px', fontFamily: 'monospace', color: '#0f172a' }}>{c.code}</td>
                      <td style={{ padding: '12px' }}>
                        <button onClick={() => handleDeleteOTP(c.id)} style={{ padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Users Card */}
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#0f172a' }}>Users</h3>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Email/Phone</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Admin</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {userProfiles.map(u => (
                    <tr key={u.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#0f172a' }}>{u.phone || u.apple_id}</td>
                      <td style={{ padding: '12px', fontSize: '14px', color: '#0f172a' }}>{u.is_admin ? 'Yes' : 'No'}</td>
                      <td style={{ padding: '12px' }}>
                        {u.is_admin ? (
                          <button onClick={() => handleRemoveAdmin(u.id)} style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                            Remove Admin
                          </button>
                        ) : (
                          <button onClick={() => handleMakeAdmin(u.id)} style={{ padding: '8px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#0f172a', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                            Make Admin
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === 'categories' && (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>Global Categories</h3>
              <button onClick={() => setShowDialog('category')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                <Plus size={16} /> Add Category
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Icon</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Color</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#0f172a' }}>{c.name}</td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#0f172a' }}>{c.icon}</td>
                    <td style={{ padding: '12px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: '1px solid #e2e8f0', backgroundColor: c.color }} />
                    </td>
                    <td style={{ padding: '12px' }}>
                      <button onClick={() => handleDelete('category', c.id)} style={{ padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* LANGUAGES TAB */}
        {activeTab === 'languages' && (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>Supported Languages</h3>
              <button onClick={() => setShowDialog('language')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                <Plus size={16} /> Add Language
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Code</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Icon</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {languages.map(l => (
                  <tr key={l.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontSize: '14px', fontFamily: 'monospace', color: '#0f172a' }}>{l.code}</td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#0f172a' }}>{l.name}</td>
                    <td style={{ padding: '12px', fontSize: '20px' }}>{l.icon}</td>
                    <td style={{ padding: '12px' }}>
                      <button onClick={() => handleDelete('language', l.id)} style={{ padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* CURRENCIES TAB */}
        {activeTab === 'currencies' && (
          <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a' }}>Supported Currencies</h3>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={handleSeedCurrencies}
                  disabled={loading}
                  style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}
                >
                  <RefreshCcw size={16} /> Seed All
                </button>
                <button onClick={() => setShowDialog('currency')} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                  <Plus size={16} /> Add Currency
                </button>
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Code</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Name</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Symbol</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Icon</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currencies.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px', fontSize: '14px', fontFamily: 'monospace', color: '#0f172a' }}>{c.code}</td>
                    <td style={{ padding: '12px', fontSize: '14px', color: '#0f172a' }}>{c.name}</td>
                    <td style={{ padding: '12px', fontSize: '14px', fontWeight: '600', color: '#0f172a' }}>{c.symbol}</td>
                    <td style={{ padding: '12px', fontSize: '20px' }}>{c.icon}</td>
                    <td style={{ padding: '12px' }}>
                      <button onClick={() => handleDelete('currency', c.id)} style={{ padding: '8px', borderRadius: '6px', border: 'none', backgroundColor: 'transparent', color: '#ef4444', cursor: 'pointer' }}>
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Simple Dialog Modal */}
        {showDialog && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowDialog(null)}>
            <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', width: '400px', maxWidth: '90%' }} onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '16px', color: '#0f172a' }}>
                New {showDialog.charAt(0).toUpperCase() + showDialog.slice(1)}
              </h3>

              {showDialog === 'category' && (
                <>
                  <input placeholder="Name" onChange={e => setNewItem({ ...newItem, name: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
                  <input placeholder="Icon (e.g. Utensils)" onChange={e => setNewItem({ ...newItem, icon: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
                  <input type="color" onChange={e => setNewItem({ ...newItem, color: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }} />
                </>
              )}

              {showDialog === 'language' && (
                <>
                  <input placeholder="Code (e.g. es)" onChange={e => setNewItem({ ...newItem, code: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
                  <input placeholder="Name (e.g. Spanish)" onChange={e => setNewItem({ ...newItem, name: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
                  <input placeholder="Icon (e.g. 🇪🇸)" onChange={e => setNewItem({ ...newItem, icon: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
                </>
              )}

              {showDialog === 'currency' && (
                <>
                  <input placeholder="Code (e.g. USD)" onChange={e => setNewItem({ ...newItem, code: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
                  <input placeholder="Name (e.g. US Dollar)" onChange={e => setNewItem({ ...newItem, name: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
                  <input placeholder="Symbol (e.g. $)" onChange={e => setNewItem({ ...newItem, symbol: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
                  <input placeholder="Icon (e.g. 🇺🇸)" onChange={e => setNewItem({ ...newItem, icon: e.target.value })} style={{ width: '100%', padding: '10px', marginBottom: '12px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }} />
                </>
              )}

              <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '16px' }}>
                <button onClick={() => setShowDialog(null)} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                  Cancel
                </button>
                <button onClick={() => handleCreate(showDialog as any)} style={{ padding: '10px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#0f172a', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                  Create
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
