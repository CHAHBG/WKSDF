import React from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function Sidebar() {
    const navigate = useNavigate();
    const location = useLocation();
    const { shopSettings, userProfile, signOut } = useAuth();

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const isAgent = userProfile?.role === 'agent';
    const shopName = shopSettings?.shop_name || 'Wakeur Sokhna';
    const shopNameParts = shopName.split(' ');
    const firstName = shopNameParts[0];
    const lastName = shopNameParts.slice(1).join(' ');

    const mainMenuItems = [
        { path: '/', label: 'Dashboard', allowedRoles: ['owner', 'agent'] },
        { path: '/inventory', label: 'Inventaire', allowedRoles: ['owner'] },
        { path: '/transfers', label: 'Transferts', allowedRoles: ['owner'] },
        { path: '/mobile-money', label: 'Mobile Money', allowedRoles: ['owner', 'agent'] },
        { path: '/sales', label: 'Ventes', allowedRoles: ['owner', 'agent'] },
        { path: '/expenses', label: 'Dépenses', allowedRoles: ['owner'] },
    ];

    const managementItems = [
        { path: '/agents', label: 'Agents', allowedRoles: ['owner'] },
        { path: '/transactions', label: 'Transactions', allowedRoles: ['owner', 'agent'] },
        { path: '/reports', label: 'Rapports & Analyses', allowedRoles: ['owner'] },
    ];

    const filterItems = (items) => {
        return items.filter(item => {
            if (!userProfile?.role) return false;
            return item.allowedRoles.includes(userProfile.role);
        });
    };

    return (
        <div className="fixed left-0 top-0 h-full w-72 bg-slate-900 border-r border-slate-800 p-6 flex flex-col z-50 text-white shadow-2xl">
            <div className="mb-10 px-2">
                <h1 className="text-3xl font-serif font-bold text-white tracking-tight flex flex-col">
                    {firstName}
                    {lastName && (
                        <span className="text-amber-500 text-lg font-sans font-medium tracking-widest uppercase mt-1">
                            {lastName}
                        </span>
                    )}
                </h1>
            </div>

            <nav className="space-y-1 flex-1 overflow-y-auto scrollbar-hide">
                <p className="px-4 mb-3 text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">Menu Principal</p>

                {filterItems(mainMenuItems).map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`block px-4 py-3 rounded-lg transition-all duration-200 font-medium border border-transparent ${location.pathname === item.path
                            ? 'bg-slate-800 text-white border-slate-700'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:border-slate-700'
                            }`}
                    >
                        {item.label}
                    </Link>
                ))}

                <div className="pt-8 pb-3">
                    <p className="px-4 text-xs font-bold text-slate-500 uppercase tracking-widest font-sans">Gestion</p>
                </div>

                {filterItems(managementItems).map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`block px-4 py-3 rounded-lg transition-all duration-200 font-medium border border-transparent ${location.pathname === item.path
                            ? 'bg-slate-800 text-white border-slate-700'
                            : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:border-slate-700'
                            }`}
                    >
                        {item.label}
                    </Link>
                ))}
            </nav>

            <div className="pt-6 border-t border-slate-800 mt-4">
                <button
                    onClick={handleLogout}
                    className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-900/20 hover:text-red-300 rounded-lg transition-all duration-200 font-medium flex items-center gap-2"
                >
                    <span>Déconnexion</span>
                </button>
            </div>
        </div>
    );
}
