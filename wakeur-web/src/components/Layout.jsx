import React, { useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Bars3Icon, MoonIcon, SunIcon, BellIcon } from '@heroicons/react/24/outline';
import Sidebar from './Sidebar';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';

const PAGE_LABELS = {
    '/': 'Tableau de bord',
    '/inventory': 'Inventaire',
    '/transfers': 'Transferts',
    '/mobile-money': 'Operations MM',
    '/sales': 'Point de Vente',
    '/expenses': 'Dépenses',
    '/agents': 'Gestion des Agents',
    '/transactions': 'Historique',
    '/reports': 'Analyses & Rapports',
};

export default function Layout() {
    const location = useLocation();
    const { shopSettings, userProfile } = useAuth();
    const { isDark, toggleTheme } = useTheme();
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    const pageLabel = useMemo(() => {
        return PAGE_LABELS[location.pathname] || 'Tableau de bord';
    }, [location.pathname]);

    const todayLabel = useMemo(() => {
        return new Intl.DateTimeFormat('fr-FR', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
        }).format(new Date());
    }, []);

    const shopName = shopSettings?.shop_name || 'Wakeur Sokhna';
    const initials = userProfile?.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || 'US';

    return (
        <div className="min-h-screen bg-teal-50/20 dark:bg-zinc-950 transition-colors duration-500">
            <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

            <main className="min-h-screen lg:ml-72 transition-all">
                {/* Header Section - Joyful Glassmorphism */}
                <header className="sticky top-0 z-30 bg-white/60 dark:bg-zinc-950/60 backdrop-blur-xl border-b border-zinc-200/50 dark:border-zinc-800/50">
                    <div className="mx-auto flex h-20 w-full max-w-7xl items-center justify-between px-8 lg:px-12">

                        {/* Left Side: Mobile Menu & Page Title */}
                        <div className="flex items-center gap-6">
                            <button
                                type="button"
                                onClick={() => setIsSidebarOpen(true)}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300 shadow-sm border border-zinc-200 dark:border-zinc-800 hover:scale-105 transition-transform lg:hidden"
                            >
                                <Bars3Icon className="h-6 w-6" />
                            </button>
                            <div className="hidden sm:block">
                                <h1 className="text-lg font-black tracking-tight text-zinc-900 dark:text-white uppercase tracking-[0.1em]">{pageLabel}</h1>
                                <div className="flex items-center gap-2 mt-0.5">
                                    <span className="h-1 w-1 rounded-full bg-teal-500 animate-pulse"></span>
                                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-teal-600 dark:text-teal-400">{shopName}</p>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: Tools & Profile */}
                        <div className="flex items-center gap-6">
                            {/* Date Badge - Muted Teal */}
                            <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-teal-50/50 dark:bg-teal-900/10 rounded-2xl text-[11px] font-black text-teal-700 dark:text-teal-400 uppercase tracking-widest border border-teal-100/50 dark:border-teal-800/50">
                                {todayLabel}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={toggleTheme}
                                    className="flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-900 text-zinc-500 hover:text-teal-600 transition-all hover:scale-110"
                                >
                                    {isDark ? <SunIcon className="h-5 w-5" /> : <MoonIcon className="h-5 w-5" />}
                                </button>
                                <button className="relative flex h-10 w-10 items-center justify-center rounded-2xl bg-zinc-50 dark:bg-zinc-900 text-zinc-500 hover:text-teal-600 transition-all hover:scale-110">
                                    <BellIcon className="h-5 w-5" />
                                    <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-orange-500 border-2 border-white dark:border-zinc-900"></span>
                                </button>
                            </div>

                            {/* User Profile - Joyful Matte */}
                            <div className="flex items-center gap-4 pl-4 border-l border-zinc-100 dark:border-zinc-800">
                                <div className="hidden text-right lg:block">
                                    <p className="text-xs font-black text-zinc-900 dark:text-white">
                                        {userProfile?.full_name?.split(' ')[0] || 'User'}
                                    </p>
                                </div>
                                <div className="h-10 w-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-teal-600/30 border-2 border-white dark:border-zinc-950 transition-transform hover:rotate-3">
                                    {initials}
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content Area */}
                <div className="mx-auto w-full max-w-7xl p-8 lg:p-12 animate-fade-in">
                    <Outlet />
                </div>
            </main>
        </div>
    );
}
