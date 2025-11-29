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
        const storedAgent = localStorage.getItem('wakeur_agent_session');
        console.log('AuthContext mount. Stored agent:', storedAgent);

        if (storedAgent) {
            try {
                const agent = JSON.parse(storedAgent);
                setAgentSession(agent);
            } catch (e) {
                console.error("Invalid agent session", e);
                localStorage.removeItem('wakeur_agent_session');
                checkUserSession();
            }
        } else {
            checkUserSession();
        }

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            console.log('AuthStateChange event:', _event, 'Session:', session?.user?.id);
            const hasAgentSession = localStorage.getItem('wakeur_agent_session');
            console.log('Has agent session in storage:', hasAgentSession);

            if (!hasAgentSession) {
                console.log('No agent session, updating user from Supabase session');
                setUser(session?.user ?? null);
                if (session?.user) {
                    loadUserProfile(session.user.id);
                } else {
                    setUserProfile(null);
                    setShopSettings(null);
                    setLoading(false);
                }
            } else {
                console.log('Agent session exists, ignoring Supabase auth change');
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkUserSession = () => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user ?? null);
            if (session?.user) {
                loadUserProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });
    };

    const setAgentSession = async (agent) => {
        console.log('Setting agent session for:', agent.id);
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
                .single();
            setShopSettings(shop);
        }

        console.log('Agent session set, setting loading to false');
        setLoading(false);
    };

    const loginAsAgent = async (phone, code) => {
        console.log('Attempting agent login:', phone);
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

            console.log('Agent found:', data.id);
            // Store session
            localStorage.setItem('wakeur_agent_session', JSON.stringify(data));
            await setAgentSession(data);
            console.log('Agent login successful');
            return { success: true };
        } catch (error) {
            console.error('Agent login error:', error);
            return { success: false, error: error.message };
        } finally {
            if (!localStorage.getItem('wakeur_agent_session')) {
                setLoading(false);
            }
        }
    };

    const loadUserProfile = async (userId) => {
        try {
            // 1. Get User Profile
            const { data: profile, error: profileError } = await supabase
                .from('users_profile')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (profileError) throw profileError;
            setUserProfile(profile);

            // 2. Get Shop Settings if profile exists and has shop_id
            if (profile?.shop_id) {
                const { data: shop, error: shopError } = await supabase
                    .from('shop_settings')
                    .select('*')
                    .eq('id', profile.shop_id)
                    .single();

                if (shopError) {
                    console.error('Error loading shop settings:', shopError);
                } else {
                    setShopSettings(shop);
                }
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
        localStorage.removeItem('wakeur_agent_session');
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
        refreshProfile: () => user && loadUserProfile(user.id),
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
