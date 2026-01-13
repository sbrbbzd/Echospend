import { supabase } from './supabaseClient';
import { getCurrentUser } from './authService';

export interface TrainingSample {
    inputText: string; // "coffee", "lunch", "uber to airport"
    inputType: 'voice' | 'text' | 'manual';
    parsedCategory?: string; // What the model predicted
    modelVersion: string;
    confidenceScore?: number;
}

export interface Correction {
    correctCategory: string; // The actual correct category
    correctionNotes?: string;
}

export const mlService = {
    /**
     * Collect training sample from user input
     * @param skipConsentCheck - Set to true for admin manual entries to bypass consent check
     */
    async collectTrainingSample(data: TrainingSample, skipConsentCheck = false): Promise<boolean> {
        if (!supabase) return false;

        try {
            const user = await getCurrentUser();
            if (!user) return false;

            // Check if user has consented to data collection (unless skipped for admin entries)
            if (!skipConsentCheck) {
                const { data: prefs } = await supabase
                    .from('ml_user_preferences')
                    .select('data_collection_consent')
                    .eq('user_id', user.id)
                    .limit(1);

                // If no preferences exist, default to TRUE (opt-out model)
                // If preferences exist but consent is FALSE, don't collect
                if (prefs && prefs.length > 0 && prefs[0]?.data_collection_consent === false) {
                    console.log('User has opted out of ML data collection');
                    return false;
                }
            }

            const { error } = await supabase
                .from('ml_training_samples')
                .insert({
                    user_id: user.id,
                    input_text: data.inputText,
                    input_type: data.inputType,
                    parsed_category: data.parsedCategory,
                    model_version: data.modelVersion,
                    confidence_score: data.confidenceScore,
                    is_anonymized: false
                });

            if (error) throw error;
            return true;
        } catch (err: any) {
            console.error('Failed to collect training sample:', err.message);
            return false;
        }
    },

    /**
     * Get samples needing review (low confidence or uncorrected)
     */
    async getSamplesForReview(limit = 50, showAll = false) {
        if (!supabase) return [];

        try {
            let query = supabase
                .from('ml_training_samples')
                .select(`
          *,
          ml_corrections (*)
        `)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (!showAll) {
                query = query.lt('confidence_score', 0.7);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (err: any) {
            console.error('Failed to get samples for review:', err.message);
            return [];
        }
    },

    /**
     * Submit admin correction
     */
    async submitCorrection(sampleId: string, correction: Correction): Promise<boolean> {
        if (!supabase) return false;

        try {
            const user = await getCurrentUser();
            if (!user) return false;

            const { error } = await supabase
                .from('ml_corrections')
                .insert({
                    sample_id: sampleId,
                    admin_id: user.id,
                    correct_category: correction.correctCategory,
                    correction_notes: correction.correctionNotes
                });

            if (error) throw error;
            return true;
        } catch (err: any) {
            console.error('Failed to submit correction:', err.message);
            return false;
        }
    },

    /**
     * Submit batch corrections (confirming existing predictions)
     */
    async submitBatchCorrections(samples: { id: string, category: string }[]): Promise<boolean> {
        if (!supabase || samples.length === 0) return false;

        try {
            const user = await getCurrentUser();
            if (!user) return false;

            const corrections = samples.map(s => ({
                sample_id: s.id,
                admin_id: user.id,
                correct_category: s.category,
                correction_notes: 'Batch confirmation'
            }));

            const { error } = await supabase
                .from('ml_corrections')
                .insert(corrections);

            if (error) throw error;
            return true;
        } catch (err: any) {
            console.error('Failed to submit batch corrections:', err.message);
            return false;
        }
    },

    /**
    * Fast retrieval for similar inputs(Cache- First Layer)
     * Used to skip LLM calls if we have data with high confidence
    */
    async findSimilarSamples(text: string): Promise<{ category: string, confidence: number } | null> {
        if (!supabase) return null;

        try {
            // First check corrections (highest priority)
            const { data: corrections } = await supabase
                .from('ml_corrections')
                .select(`
                    correct_category,
                    ml_training_samples!inner(input_text)
                `)
                .ilike('ml_training_samples.input_text', `%${text.trim()}%`)
                .limit(1);

            if (corrections && corrections.length > 0) {
                return {
                    category: corrections[0].correct_category,
                    confidence: 0.99 // Manually corrected = almost certain
                };
            }

            // Then check previous high-confidence predictions
            // Simple text match for now. In a real app, we'd use pgvector/embeddings
            const { data: samples } = await supabase
                .from('ml_training_samples')
                .select('parsed_category, confidence_score')
                .eq('input_text', text.trim())
                .gt('confidence_score', 0.9)
                .order('confidence_score', { ascending: false })
                .limit(1);

            if (samples && samples.length > 0) {
                return {
                    category: samples[0].parsed_category,
                    confidence: samples[0].confidence_score
                };
            }

            return null;
        } catch (err: any) {
            console.error('Fast retrieval failed:', err.message);
            return null;
        }
    },

    /**
     * Get validated examples for Few-Shot Prompting
     * Returns a limited set of high-quality examples (corrected or high confidence)
     */
    async getFewShotExamples(limit = 10) {
        if (!supabase) return [];

        try {
            // Priority 1: Get manually corrected examples (Gold standard)
            const { data: corrections, error } = await supabase
                .from('ml_corrections')
                .select(`
                    correct_category,
                    ml_training_samples!inner(input_text)
                `)
                .order('created_at', { ascending: false })
                .limit(limit);

            if (error) throw error;

            if (corrections && corrections.length > 0) {
                return corrections.map((c: any) => ({
                    input: c.ml_training_samples?.input_text || '',
                    output: c.correct_category
                }));
            }

            // Priority 2: If no corrections, get high confidence predictions
            const { data: highConf } = await supabase
                .from('ml_training_samples')
                .select('input_text, parsed_category')
                .gt('confidence_score', 0.95)
                .limit(limit);

            return (highConf || []).map(s => ({
                input: s.input_text,
                output: s.parsed_category
            }));

        } catch (err: any) {
            console.error('Failed to get few-shot examples:', err.message);
            return [];
        }
    },

    /**
     * Get all training data with corrections
     */
    async getTrainingDataset() {
        if (!supabase) return [];

        try {
            const { data, error } = await supabase
                .from('ml_training_samples')
                .select(`
                  *,
                  ml_corrections (*)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Format for training: input text -> category
            return (data || []).map(sample => ({
                input: sample.input_text,
                category: sample.ml_corrections?.[0]?.correct_category || sample.parsed_category,
                confidence: sample.confidence_score,
                corrected: !!sample.ml_corrections?.[0]
            }));
        } catch (err: any) {
            console.error('Failed to get training dataset:', err.message);
            return [];
        }
    },

    /**
     * Get count of unapplied corrections
     */
    async getUnappliedCorrectionsCount(): Promise<number> {
        if (!supabase) return 0;

        try {
            const { data: lastModel } = await supabase
                .from('ml_model_versions')
                .select('deployed_at')
                .eq('is_active', true)
                .limit(1);

            const lastDeployment = (lastModel && lastModel.length > 0) ? lastModel[0].deployed_at : new Date(0);

            const { count, error } = await supabase
                .from('ml_corrections')
                .select('*', { count: 'exact', head: true })
                .gt('created_at', lastDeployment);

            if (error) throw error;
            return count || 0;
        } catch (err: any) {
            console.error('Failed to get unapplied corrections count:', err.message);
            return 0;
        }
    },

    /**
     * Create new model version
     */
    async createModelVersion(versionName: string, samplesCount: number): Promise<boolean> {
        if (!supabase) return false;

        try {
            // Deactivate current active model
            await supabase
                .from('ml_model_versions')
                .update({ is_active: false })
                .eq('is_active', true);

            // Create new version
            const { error } = await supabase
                .from('ml_model_versions')
                .insert({
                    version_name: versionName,
                    base_model: 'gemini-2.5-flash',
                    training_samples_count: samplesCount,
                    deployed_at: new Date().toISOString(),
                    is_active: true
                });

            if (error) throw error;
            return true;
        } catch (err: any) {
            console.error('Failed to create model version:', err.message);
            return false;
        }
    },

    /**
     * Get or create user ML preferences
     */
    async getUserMLPreferences(userId: string) {
        if (!supabase) return null;

        try {
            const { data, error } = await supabase
                .from('ml_user_preferences')
                .select('*')
                .eq('user_id', userId)
                .limit(1);

            if (!error && (!data || data.length === 0)) {
                // No preferences found, create default with consent enabled
                const { data: newPrefs, error: insertError } = await supabase
                    .from('ml_user_preferences')
                    .insert({ user_id: userId, data_collection_consent: true }) // Default to TRUE
                    .select()
                    .limit(1);

                if (insertError) throw insertError;
                return newPrefs && newPrefs.length > 0 ? newPrefs[0] : null;
            }

            if (error) throw error;
            return data && data.length > 0 ? data[0] : null;
        } catch (err: any) {
            console.error('Failed to get ML preferences:', err.message);
            return null;
        }
    },

    /**
     * Update user ML consent
     */
    async updateMLConsent(userId: string, consent: boolean): Promise<boolean> {
        if (!supabase) return false;

        try {
            const { error } = await supabase
                .from('ml_user_preferences')
                .upsert({
                    user_id: userId,
                    data_collection_consent: consent,
                    updated_at: new Date().toISOString()
                });

            if (error) throw error;
            return true;
        } catch (err: any) {
            console.error('Failed to update ML consent:', err.message);
            return false;
        }
    }
};
