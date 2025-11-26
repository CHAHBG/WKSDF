import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';

export default function Sidebar() {
    const navigate = useNavigate();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    return (
        <div className="fixed left-0 top-0 h-full w-64 bg-blue-600 text-white p-6">
            <div className="mb-8">
                <h1 className="text-2xl font-bold">Wakeur Sokhna</h1>
            </div>
            <nav className="space-y-2">
                <Link
                    to="/"
                    className="block px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                    Dashboard
                </Link>
                <Link
                    to="/inventory"
                    className="block px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                    Inventory
                </Link>
                <Link
                    to="/transfers"
                    className="block px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                    Transfers
                </Link>
                <Link
                    to="/mobile-money"
                    className="block px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                    Mobile Money
                </Link>
                <Link
                    to="/sales"
                    className="block px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                    Sales
                </Link>
                <div className="pt-4 pb-2">
                    <p className="px-4 text-xs font-semibold text-blue-200 uppercase tracking-wider">
                        Agent System
                    </p>
                </div>
                <Link
                    to="/agents"
                    className="block px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                    Agents
                </Link>
                <Link
                    to="/transactions"
                    className="block px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                    Transactions
                </Link>
                <Link
                    to="/daily-reports"
                    className="block px-4 py-2 rounded hover:bg-blue-700 transition"
                >
                    Daily Reports
                </Link>
            </nav>
            <div className="absolute bottom-6 left-6 right-6">
                <button
                    onClick={handleLogout}
                    className="w-full px-4 py-2 bg-red-500 rounded hover:bg-red-600 transition"
                >
                    Logout
                </button>
            </div>
        </div>
    );
}
