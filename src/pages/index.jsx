import Layout from "./Layout.jsx";
import Login from "../components/Login.jsx";

import Dashboard from "./Dashboard";
import Accounts from "./Accounts";
import Transactions from "./Transactions";
import Forecasts from "./Forecasts";
import Budgets from "./Budgets";
import Calendar from "./Calendar";
import Settings from "./Settings";
import Admin from "./Admin";
import Users from "./Users";
import ImportExport from "./ImportExport";
import CreditCards from "./CreditCards";
import Reports from "./Reports";

import { BrowserRouter as Router, Route, Routes, useLocation, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { User } from '../api/entities';
import { setAuthToken } from '../api/client';

const PAGES = {
    
    Dashboard: Dashboard,
    
    Accounts: Accounts,
    
    Transactions: Transactions,
    
    Forecasts: Forecasts,
    
    Budgets: Budgets,
    
    Calendar: Calendar,
    
    Settings: Settings,
    
    Admin: Admin,
    
    Users: Users,
    
    ImportExport: ImportExport,
    
    CreditCards: CreditCards,
    
    Reports: Reports,
    
}

function _getCurrentPage(url) {
    if (url.endsWith('/')) {
        url = url.slice(0, -1);
    }
    let urlLastPart = url.split('/').pop();
    if (urlLastPart.includes('?')) {
        urlLastPart = urlLastPart.split('?')[0];
    }

    const pageName = Object.keys(PAGES).find(page => page.toLowerCase() === urlLastPart.toLowerCase());
    return pageName || Object.keys(PAGES)[0];
}

// Protected Route Component
function ProtectedRoute({ children }) {
    const [isAuthenticated, setIsAuthenticated] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const token = localStorage.getItem('token');
            if (!token) {
                setIsAuthenticated(false);
                setLoading(false);
                return;
            }

            try {
                setAuthToken(token);
                await User.me();
                setIsAuthenticated(true);
            } catch (error) {
                console.error('Auth check failed:', error);
                localStorage.removeItem('token');
                setAuthToken(null);
                setIsAuthenticated(false);
            } finally {
                setLoading(false);
            }
        };

        checkAuth();
    }, []);

    if (loading) {
        return (
            <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '100vh',
                fontSize: '18px'
            }}>
                Carregando...
            </div>
        );
    }

    return isAuthenticated ? children : <Navigate to="/login" replace />;
}

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Dashboard />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Dashboard />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/accounts" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Accounts />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/transactions" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Transactions />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/forecasts" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Forecasts />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/budgets" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Budgets />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/calendar" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Calendar />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/settings" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Settings />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/admin" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Admin />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/users" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Users />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/importexport" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <ImportExport />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/creditcards" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <CreditCards />
                    </Layout>
                </ProtectedRoute>
            } />
            <Route path="/reports" element={
                <ProtectedRoute>
                    <Layout currentPageName={currentPage}>
                        <Reports />
                    </Layout>
                </ProtectedRoute>
            } />
        </Routes>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}