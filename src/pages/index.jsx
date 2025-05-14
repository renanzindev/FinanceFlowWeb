import Layout from "./Layout.jsx";

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

import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';

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

// Create a wrapper component that uses useLocation inside the Router context
function PagesContent() {
    const location = useLocation();
    const currentPage = _getCurrentPage(location.pathname);
    
    return (
        <Layout currentPageName={currentPage}>
            <Routes>            
                
                    <Route path="/" element={<Dashboard />} />
                
                
                <Route path="/Dashboard" element={<Dashboard />} />
                
                <Route path="/Accounts" element={<Accounts />} />
                
                <Route path="/Transactions" element={<Transactions />} />
                
                <Route path="/Forecasts" element={<Forecasts />} />
                
                <Route path="/Budgets" element={<Budgets />} />
                
                <Route path="/Calendar" element={<Calendar />} />
                
                <Route path="/Settings" element={<Settings />} />
                
                <Route path="/Admin" element={<Admin />} />
                
                <Route path="/Users" element={<Users />} />
                
                <Route path="/ImportExport" element={<ImportExport />} />
                
                <Route path="/CreditCards" element={<CreditCards />} />
                
                <Route path="/Reports" element={<Reports />} />
                
            </Routes>
        </Layout>
    );
}

export default function Pages() {
    return (
        <Router>
            <PagesContent />
        </Router>
    );
}