import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import CaseForm from './pages/CaseForm';
import Layout from './components/Layout';

function PrivateRoute({ children }: { children: JSX.Element }) {
    const token = localStorage.getItem('token');
    return token ? children : <Navigate to="/login" />;
}

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
                    <Route index element={<Dashboard />} />
                    <Route path="cases/new" element={<CaseForm />} />
                    <Route path="cases/:id" element={<CaseForm />} />
                </Route>
            </Routes>
        </BrowserRouter>
    );
}

export default App;
