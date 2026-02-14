/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [shopSettings, setShopSettings] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check for Agent Session first
        const storedAgent = localStorage.getItem('ness_agent_session');

        if (storedAgent) {
            try {
                const agent = JSON.parse(storedAgent);
                setAgentSession(agent);
            } catch (e) {
                console.error("Invalid agent session", e);
                localStorage.removeItem('ness_agent_session');
                supabase.auth.getSession().then(({ data: { session } }) => {
                    setUser(session?.user ?? null);
                    if (session?.user) {
                        loadUserProfile(session.user);
                    } else {
                        setLoading(false);
                    }
                });
            }
        } else {
            supabase.auth.getSession().then(({ data: { session } }) => {
                setUser(session?.user ?? null);
                if (session?.user) {
                    loadUserProfile(session.user);
                } else {
                    setLoading(false);
                }
            });
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const hasAgentSession = localStorage.getItem('ness_agent_session');

            if (!hasAgentSession) {
                setUser(session?.user ?? null);
                if (session?.user) {
                    loadUserProfile(session.user);
                } else {
                    setUserProfile(null);
                    setShopSettings(null);
                    setLoading(false);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const setAgentSession = async (agent) => {
        setUser({ id: agent.id, role: 'agent', email: 'agent@wakeur.com' }); // Mock user object
        setUserProfile({
            id: agent.id,
            role: 'agent',
            shop_id: agent.shop_id,
            full_name: agent.name,
            phone_number: agent.phone
        });

        // Fetch shop settings for agent
        if (agent.shop_id) {
            const { data: shop } = await supabase
                .from('shop_settings')
                .select('*')
                .eq('id', agent.shop_id)
                .maybeSingle();
            setShopSettings(shop);
        } else {
            setShopSettings(null);
        }

        setLoading(false);
    };

    const loginAsAgent = async (phone, code) => {
        setLoading(true);
        try {
            // Sanitize phone number
            const sanitizedPhone = phone.replace(/\D/g, '');

            // Call the secure RPC function
            const { data, error } = await supabase
                .rpc('login_agent', {
                    phone_input: sanitizedPhone,
                    code_input: code
                });

            if (error) {
                console.error('Supabase RPC error:', error);
                throw error;
            }

            if (!data) throw new Error('Identifiants incorrects');

            // Store session
            localStorage.setItem('ness_agent_session', JSON.stringify(data));
            await setAgentSession(data);
            return { success: true };
        } catch (error) {
            console.error('Agent login error:', error);
            return { success: false, error: error.message };
        } finally {
            if (!localStorage.getItem('ness_agent_session')) {
                setLoading(false);
            }
        }
    };

    const loadUserProfile = async (authUser) => {
        const userId = typeof authUser === 'string' ? authUser : authUser?.id;
        if (!userId) {
            setUserProfile(null);
            setShopSettings(null);
            setLoading(false);
            return;
        }

        try {
            // 1. Get User Profile
            const { data: existingProfile, error: profileError } = await supabase
                .from('users_profile')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (profileError) throw profileError;
            let profile = existingProfile;

            // New auth users should default to owner unless an explicit profile already exists.
            if (!profile) {
                const { data: createdProfile, error: createProfileError } = await supabase
                    .from('users_profile')
                    .upsert({
                        id: userId,
                        role: 'owner',
                        full_name: authUser?.user_metadata?.full_name ?? null,
                        phone_number: authUser?.phone ?? null,
                    }, { onConflict: 'id' })
                    .select('*')
                    .maybeSingle();

                if (createProfileError) throw createProfileError;
                profile = createdProfile;
            }

            setUserProfile(profile);

            // 2. Get Shop Settings if profile exists and has shop_id
            if (profile?.shop_id) {
                const { data: shop, error: shopError } = await supabase
                    .from('shop_settings')
                    .select('*')
                    .eq('id', profile.shop_id)
                    .maybeSingle();

                if (shopError) {
                    console.error('Error loading shop settings:', shopError);
                } else {
                    setShopSettings(shop);
                }
            } else {
                setShopSettings(null);
            }

        } catch (error) {
            console.error('Error loading user profile:', error);
            setUserProfile(null);
            setShopSettings(null);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        localStorage.removeItem('ness_agent_session');
        await supabase.auth.signOut();
        setUser(null);
        setUserProfile(null);
        setShopSettings(null);
    };

    const isOwner = () => {
        return userProfile?.role === 'owner';
    };

    const isAgent = () => {
        return userProfile?.role === 'agent';
    };

    const getShopId = () => {
        return userProfile?.shop_id;
    };

    const value = {
        user,
        userProfile,
        shopSettings,
        loading,
        signOut,
        loginAsAgent,
        isOwner,
        isAgent,
        getShopId,
        refreshProfile: () => user && loadUserProfile(user),
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
