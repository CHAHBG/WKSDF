import React, { useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Bars3Icon, MoonIcon, SunIcon, BellIcon, UserCircleIcon } from '@heroicons/react/24/outline';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const PAGE_LABELS = {
    '/': 'Tableau de bord',
    '/inventory': 'Gestion d\'inventaire',
    '/transfers': 'Suivi des transferts',
    '/mobile-money': 'Operations Mobile Money',
    '/sales': 'Point de Vente (POS)',
    '/expenses': 'Gestion des dépenses',
    '/agents': 'Gestion des équipes',
    '/transactions': 'Historique transactionnel',
    '/reports': 'Rapports d\'activité',
};

export default function Layout() {
    const location = useLocation();
    const { shopSettings, userProfile } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const pageLabel = useMemo(() => {
        return PAGE_LABELS[location.pathname] || 'Espace de gestion';
    }, [location.pathname]);

    const todayLabel = useMemo(() => {
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        }).format(new Date());
    }, []);

    const shopName = shopSettings?.shop_name || 'Wakeur Sokhna';
    const initials = userProfile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'US';

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="min-h-screen lg:ml-72 transition-all duration-300">
                {/* Header Section */}
                <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
                    <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

                        {/* Left Side: Mobile Menu & Page Title */}
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => setIsSidebarOpen(true)}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm hover:bg-slate-50 lg:hidden"
                            >
                                <Bars3Icon className="h-6 w-6" />
                            </button>
                            <div className="hidden sm:block">
                                <h1 className="text-xl font-black tracking-tight text-slate-900 dark:text-white">{pageLabel}</h1>
                                <p className="text-[10px] font-bold uppercase tracking-widest text-indigo-500">{shopName}</p>
                            </div>
                        </div>

                        {/* Right Side: Tools & Profile */}
                        <div className="flex items-center gap-3 sm:gap-6">
                            {/* Date Badge */}
                            <div className="hidden md:flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-[11px] font-bold text-slate-600 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                                {todayLabel}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-1 sm:gap-2">
                                <button
                                    onClick={toggleTheme}
                                    className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
                                >
                                    {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                                </button>
                                <button className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors">
                                    <BellIcon className="h-5 w-5" />
                                </button>
                            </div>

                            {/* User Profile */}
                            <div className="flex items-center gap-3 border-l border-slate-200 dark:border-slate-800 pl-3 sm:pl-6">
                                <div className="hidden text-right lg:block">
                                    <p className="text-sm font-bold leading-none text-slate-900 dark:text-white">
                                        {userProfile?.full_name?.split(' ')[0] || 'User'}
                                    </p>
                                    <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                                        {userProfile?.role || 'Compte'}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-full bg-indigo-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-indigo-600/20 cursor-pointer hover:scale-105 transition-transform">
                                    {initials}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="mx-auto w-full max-w-7xl p-4 sm:p-6 lg:p-10 animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}


