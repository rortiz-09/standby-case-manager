import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import Layout from './components/Layout';
import { ToastProvider } from './context/ToastContext';

// Lazy load pages for better performance
const Login = lazy(() => import('./pages/Login'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const CaseForm = lazy(() => import('./pages/CaseForm'));
const UserManagement = lazy(() => import('./pages/UserManagement'));
const Developers = lazy(() => import('./pages/Developers'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Premium loading spinner
const LoadingSpinner = () => (
    <div className="flex items-center justify-center h-screen bg-vscode-light-bg dark:bg-vscode-bg transition-colors duration-300">
        <div className="relative">
            <div className="w-12 h-12 rounded-full border-4 border-slate-200 dark:border-slate-700 opacity-25"></div>
            <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-t-indigo-600 dark:border-t-indigo-500 animate-spin"></div>
        </div>
    </div>
);

function PrivateRoute({ children }: { children: JSX.Element }) {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
}

import { ThemeProvider } from './context/ThemeContext';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
            staleTime: 5 * 60 * 1000, // 5 minutes
        },
    },
});

function App() {
    return (
        <QueryClientProvider client={queryClient}>
            <ThemeProvider>
                <ToastProvider>
                    <BrowserRouter>
                        <Suspense fallback={<LoadingSpinner />}>
                            <Routes>
                                <Route path="/login" element={<Login />} />
                                <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                                    <Route index element={<Dashboard />} />
                                    <Route path="cases/new" element={<CaseForm />} />
                                    <Route path="cases/:id" element={<CaseForm />} />
                                    <Route path="users" element={<UserManagement />} />
                                    <Route path="developers" element={<Developers />} />
                                    <Route path="*" element={<NotFound />} />
                                </Route>
                            </Routes>
                        </Suspense>
                    </BrowserRouter>
                </ToastProvider>
            </ThemeProvider>
        </QueryClientProvider>
    );
}

export default App;
