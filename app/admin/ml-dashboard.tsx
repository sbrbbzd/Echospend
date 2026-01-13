import React, { useState, useEffect } from 'react';
import { toast } from '../../components/ui/sonner';
import { router } from 'expo-router';
import { RefreshCcw, Check, X, ChevronLeft, TrendingUp, Database, GitBranch } from 'lucide-react';
import { mlService } from '../../services/mlService';
import { useAuth } from '../../contexts/AuthContext';
import { useAppContext } from '../../contexts/AppContext';

const MLDashboard: React.FC = () => {
    const { isAdminUser, loading: authLoading } = useAuth();
    const { categories } = useAppContext();
    const [samples, setSamples] = useState<any[]>([]);
    const [stats, setStats] = useState({ total: 0, corrected: 0, pending: 0 });
    const [loading, setLoading] = useState(false);
    const [editingSample, setEditingSample] = useState<any | null>(null);
    const [correction, setCorrection] = useState<any>({});
    const [showAll, setShowAll] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [showManualEntry, setShowManualEntry] = useState(false);
    const [manualData, setManualData] = useState<any>({
        inputText: '',
        inputType: 'text',
        parsedCategory: ''
    });

    useEffect(() => {
        if (!authLoading) {
            if (!isAdminUser) {
                toast.error('Access denied. Admin privileges required.');
                router.replace('/');
                return;
            }
            loadData();
        }
    }, [isAdminUser, authLoading, showAll]);

    const loadData = async () => {
        setLoading(true);
        try {
            const data = await mlService.getSamplesForReview(100, showAll);
            setSamples(data);
            setSelectedIds(new Set()); // Reset selection on reload

            const corrected = data.filter((s: any) => s.ml_corrections?.length > 0).length;
            setStats({
                total: data.length,
                corrected,
                pending: data.length - corrected
            });
        } catch (error) {
            console.error(error);
            toast.error('Failed to load ML data');
        } finally {
            setLoading(false);
        }
    };

    const handleCorrect = (sample: any) => {
        setEditingSample(sample);
        setCorrection({
            correctCategory: sample.parsed_category || '',
            correctionNotes: ''
        });
    };

    const submitCorrection = async () => {
        if (!editingSample) return;

        const success = await mlService.submitCorrection(editingSample.id, correction);
        if (success) {
            toast.success('Correction saved');
            setEditingSample(null);
            loadData();
        } else {
            toast.error('Failed to save correction');
        }
    };

    const triggerRetraining = async () => {
        const dataset = await mlService.getTrainingDataset();
        const versionName = `v${Date.now()}`;

        const success = await mlService.createModelVersion(versionName, dataset.length);
        if (success) {
            toast.success(`Model ${versionName} created with ${dataset.length} samples`);
        } else {
            toast.error('Failed to create model version');
        }
    };

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            // Select all currently visible samples that aren't already corrected
            const pendingIds = samples
                .filter(s => !s.ml_corrections?.length)
                .map(s => s.id);
            setSelectedIds(new Set(pendingIds));
        } else {
            setSelectedIds(new Set());
        }
    };

    const toggleSelection = (id: string) => {
        const newSet = new Set(selectedIds);
        if (newSet.has(id)) {
            newSet.delete(id);
        } else {
            newSet.add(id);
        }
        setSelectedIds(newSet);
    };

    const handleBatchConfirm = async () => {
        if (selectedIds.size === 0) return;

        const samplesToConfirm = samples
            .filter(s => selectedIds.has(s.id))
            .map(s => ({
                id: s.id,
                category: s.parsed_category || 'Uncategorized'
            }));

        const success = await mlService.submitBatchCorrections(samplesToConfirm);
        if (success) {
            toast.success(`Confirmed ${samplesToConfirm.length} samples`);
            loadData();
        } else {
            toast.error('Failed to confirm samples');
        }
    };

    const submitManualData = async () => {
        if (!manualData.inputText || !manualData.parsedCategory) {
            toast.error('Input text and category are required');
            return;
        }

        const success = await mlService.collectTrainingSample({
            inputText: manualData.inputText,
            inputType: manualData.inputType,
            parsedCategory: manualData.parsedCategory,
            modelVersion: 'manual-entry-v1',
            confidenceScore: 1.0 // Manual entries are 100% confident
        }, true); // Skip consent check for admin manual entries

        if (success) {
            toast.success('Training data added successfully');
            setShowManualEntry(false);
            setManualData({
                inputText: '',
                inputType: 'text',
                parsedCategory: ''
            });
            loadData();
        } else {
            toast.error('Failed to add training data');
        }
    };

    if (authLoading || !isAdminUser) return null;

    return (
        <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f8fafc', fontFamily: 'system-ui, -apple-system, sans-serif' }}>

            {/* Sidebar */}
            <div style={{ width: '280px', backgroundColor: '#fff', borderRight: '1px solid #e2e8f0', padding: '24px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <button onClick={() => router.back()} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '8px', border: 'none', backgroundColor: 'transparent', color: '#64748b', cursor: 'pointer', fontSize: '14px', fontWeight: '500', marginBottom: '16px' }}>
                    <ChevronLeft size={18} /> Back to Admin
                </button>

                <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '32px', color: '#0f172a' }}>ML Dashboard</h1>

                {/* Stats Cards */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                    <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#f1f5f9' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <Database size={16} color="#64748b" />
                            <span style={{ fontSize: '12px', color: '#64748b', fontWeight: '600' }}>TOTAL SAMPLES</span>
                        </div>
                        <p style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', margin: 0 }}>{stats.total}</p>
                    </div>

                    <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#dcfce7' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <Check size={16} color="#16a34a" />
                            <span style={{ fontSize: '12px', color: '#16a34a', fontWeight: '600' }}>CORRECTED</span>
                        </div>
                        <p style={{ fontSize: '28px', fontWeight: '700', color: '#16a34a', margin: 0 }}>{stats.corrected}</p>
                    </div>

                    <div style={{ padding: '16px', borderRadius: '12px', backgroundColor: '#fef3c7' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                            <TrendingUp size={16} color="#ca8a04" />
                            <span style={{ fontSize: '12px', color: '#ca8a04', fontWeight: '600' }}>PENDING</span>
                        </div>
                        <p style={{ fontSize: '28px', fontWeight: '700', color: '#ca8a04', margin: 0 }}>{stats.pending}</p>
                    </div>
                </div>

                <button onClick={() => setShowManualEntry(true)} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', color: '#0f172a', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <line x1="12" y1="5" x2="12" y2="19" />
                        <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add Training Data
                </button>

                <button onClick={triggerRetraining} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '12px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#0f172a', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600', marginTop: 'auto' }}>
                    <GitBranch size={18} /> Trigger Retraining
                </button>
            </div>

            {/* Main Content */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <h2 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', margin: 0 }}>Training Samples</h2>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: '#64748b', cursor: 'pointer' }}>
                            <input
                                type="checkbox"
                                checked={showAll}
                                onChange={e => setShowAll(e.target.checked)}
                                style={{ accentColor: '#0f172a', width: '16px', height: '16px' }}
                            />
                            Show All
                        </label>
                    </div>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        {selectedIds.size > 0 && (
                            <button onClick={handleBatchConfirm} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#16a34a', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                                <Check size={16} /> Confirm Selected ({selectedIds.size})
                            </button>
                        )}
                        <button onClick={() => loadData()} disabled={loading} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                            <RefreshCcw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
                        </button>
                    </div>
                </div>

                {/* Samples Table */}
                <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', padding: '24px' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                                <th style={{ padding: '12px', width: '40px' }}>
                                    <input
                                        type="checkbox"
                                        onChange={e => handleSelectAll(e.target.checked)}
                                        checked={samples.length > 0 && samples.every(s => selectedIds.has(s.id) || s.ml_corrections?.length > 0)}
                                        style={{ accentColor: '#0f172a', width: '16px', height: '16px', cursor: 'pointer' }}
                                    />
                                </th>
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Input Text</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Predicted Category</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Confidence</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Status</th>
                                <th style={{ padding: '12px', textAlign: 'left', fontSize: '14px', fontWeight: '500', color: '#64748b' }}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {samples.map(sample => (
                                <tr key={sample.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <td style={{ padding: '12px' }}>
                                        {!sample.ml_corrections?.length && (
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(sample.id)}
                                                onChange={() => toggleSelection(sample.id)}
                                                style={{ accentColor: '#0f172a', width: '16px', height: '16px', cursor: 'pointer' }}
                                            />
                                        )}
                                    </td>
                                    <td style={{ padding: '12px', fontSize: '14px', color: '#0f172a', maxWidth: '250px' }}>
                                        <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {sample.input_text}
                                        </div>
                                        <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
                                            {sample.input_type}
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px', fontSize: '14px', color: '#0f172a' }}>
                                        <div style={{ fontWeight: '600' }}>{sample.parsed_category || 'Unknown'}</div>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        <div style={{
                                            display: 'inline-block',
                                            padding: '4px 8px',
                                            borderRadius: '6px',
                                            fontSize: '12px',
                                            fontWeight: '600',
                                            backgroundColor: sample.confidence_score > 0.8 ? '#dcfce7' : sample.confidence_score > 0.6 ? '#fef3c7' : '#fee2e2',
                                            color: sample.confidence_score > 0.8 ? '#16a34a' : sample.confidence_score > 0.6 ? '#ca8a04' : '#dc2626'
                                        }}>
                                            {(sample.confidence_score * 100).toFixed(0)}%
                                        </div>
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {sample.ml_corrections?.length > 0 ? (
                                            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#16a34a', fontSize: '13px', fontWeight: '500' }}>
                                                <Check size={14} /> Corrected
                                            </span>
                                        ) : (
                                            <span style={{ color: '#94a3b8', fontSize: '13px' }}>Pending</span>
                                        )}
                                    </td>
                                    <td style={{ padding: '12px' }}>
                                        {!sample.ml_corrections?.length && (
                                            <button onClick={() => handleCorrect(sample)} style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', backgroundColor: '#0f172a', color: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: '500' }}>
                                                Correct
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Correction Modal */}
            {editingSample && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setEditingSample(null)}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', width: '600px', maxWidth: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#0f172a' }}>
                            Correct Prediction
                        </h3>

                        <div style={{ marginBottom: '16px', padding: '12px', backgroundColor: '#f1f5f9', borderRadius: '8px' }}>
                            <p style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', fontWeight: '600' }}>ORIGINAL INPUT</p>
                            <p style={{ fontSize: '14px', color: '#0f172a', margin: 0 }}>{editingSample.input_text}</p>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '6px' }}>Correct Category *</label>
                            <select
                                value={correction.correctCategory || ''}
                                onChange={e => setCorrection({ ...correction, correctCategory: e.target.value })}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }}
                            >
                                <option value="">Select category...</option>
                                {categories.map(cat => (
                                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                            <p style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>Model predicted: <strong>{editingSample.parsed_category}</strong></p>
                        </div>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '6px' }}>Notes (optional)</label>
                            <textarea
                                value={correction.correctionNotes || ''}
                                onChange={e => setCorrection({ ...correction, correctionNotes: e.target.value })}
                                rows={3}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', fontFamily: 'inherit' }}
                                placeholder="Why was this correction needed?"
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setEditingSample(null)} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                                Cancel
                            </button>
                            <button onClick={submitCorrection} style={{ padding: '10px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#16a34a', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                                Save Correction
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Manual Entry Modal */}
            {showManualEntry && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }} onClick={() => setShowManualEntry(false)}>
                    <div style={{ backgroundColor: '#fff', borderRadius: '12px', padding: '24px', width: '600px', maxWidth: '90%', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        <h3 style={{ fontSize: '20px', fontWeight: '600', marginBottom: '16px', color: '#0f172a' }}>
                            Add Training Data Manually
                        </h3>

                        <div style={{ marginBottom: '16px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '6px' }}>Input Text * (What the user said/typed)</label>
                            <textarea
                                value={manualData.inputText}
                                onChange={e => setManualData({ ...manualData, inputText: e.target.value })}
                                rows={3}
                                style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', fontFamily: 'inherit' }}
                                placeholder="e.g., coffee, lunch at chipotle, uber to airport"
                            />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '6px' }}>Input Type</label>
                                <select
                                    value={manualData.inputType}
                                    onChange={e => setManualData({ ...manualData, inputType: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }}
                                >
                                    <option value="text">Text</option>
                                    <option value="voice">Voice</option>
                                    <option value="manual">Manual</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#64748b', marginBottom: '6px' }}>Correct Category *</label>
                                <select
                                    value={manualData.parsedCategory}
                                    onChange={e => setManualData({ ...manualData, parsedCategory: e.target.value })}
                                    style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px' }}
                                >
                                    <option value="">Select category...</option>
                                    {categories.map(cat => (
                                        <option key={cat.id} value={cat.name}>{cat.name}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                            <button onClick={() => setShowManualEntry(false)} style={{ padding: '10px 16px', borderRadius: '6px', border: '1px solid #e2e8f0', backgroundColor: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '500' }}>
                                Cancel
                            </button>
                            <button onClick={submitManualData} style={{ padding: '10px 16px', borderRadius: '6px', border: 'none', backgroundColor: '#0f172a', color: '#fff', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}>
                                Add Training Data
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MLDashboard;
