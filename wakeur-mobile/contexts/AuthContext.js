import { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { supabase } from '../services/supabase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [userProfile, setUserProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkSession();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            const agentSession = await AsyncStorage.getItem('wakeur_agent_session');
            if (!agentSession) {
                setUser(session?.user ?? null);
                if (session?.user) {
                    loadUserProfile(session.user.id);
                } else {
                    setUserProfile(null);
                    setLoading(false);
                }
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const checkSession = async () => {
        try {
            // 1. Check for Agent Session
            const storedAgent = await AsyncStorage.getItem('wakeur_agent_session');
            if (storedAgent) {
                const agent = JSON.parse(storedAgent);
                await setAgentSession(agent);
                return;
            }

            // 2. Check for Supabase Session
            const { data: { session }, error } = await supabase.auth.getSession();
            if (error) throw error;

            setUser(session?.user ?? null);
            if (session?.user) {
                await loadUserProfile(session.user.id);
            } else {
                setLoading(false);
            }
        } catch (error) {
            console.error('Session check error:', error);
            // Handle invalid refresh token errors
            if (error.message?.includes('Invalid Refresh Token') || error.message?.includes('Refresh Token Not Found')) {
                await signOut();
            }
            setLoading(false);
        }
    };

    const setAgentSession = async (agent) => {
        setUser({ id: agent.id, role: 'agent', email: 'agent@wakeur.com' }); // Mock user object
        setUserProfile({
            id: agent.id,
            role: 'agent',
            shop_id: agent.shop_id,
            full_name: agent.name,
            phone_number: agent.phone
        });
        setLoading(false);
    };

    const loginAsAgent = async (phone, code) => {
        setLoading(true);
        try {
            // Sanitize phone number (remove spaces, dashes, parentheses)
            const sanitizedPhone = phone.replace(/\D/g, '');
            console.log('Attempting agent login with:', sanitizedPhone, 'code:', code);

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
            await AsyncStorage.setItem('wakeur_agent_session', JSON.stringify(data));
            await setAgentSession(data);
            return { success: true };
        } catch (error) {
            console.error('Agent login error:', error);
            return { success: false, error: error.message };
        } finally {
            setLoading(false);
        }
    };

    const loadUserProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('users_profile')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            if (error) throw error;
            setUserProfile(data); // data will be null if no profile exists
        } catch (error) {
            console.error('Error loading user profile:', error);
            setUserProfile(null);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        try {
            await AsyncStorage.removeItem('wakeur_agent_session');
            await supabase.auth.signOut();
            setUser(null);
            setUserProfile(null);
        } catch (error) {
            console.error('Error signing out:', error);
        }
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

    const value = useMemo(() => ({
        user,
        userProfile,
        loading,
        signOut,
        loginAsAgent,
        isOwner,
        isAgent,
        getShopId,
        refreshProfile: () => user && loadUserProfile(user.id),
    }), [user, userProfile, loading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
