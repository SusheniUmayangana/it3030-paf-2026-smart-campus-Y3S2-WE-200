import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';

import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Landing from '../pages/Landing'; // Dashboard
import UserManagement from '../pages/UserManagement';
import Facilities from '../pages/Facilities';
import Bookings from '../pages/Bookings';
import Tickets from '../pages/Tickets';
import Notifications from '../pages/Notifications';

export default function AppRoutes({ user, onSetUser, onLogout }) {
    const ProtectedRoute = ({ element }) => {
        return user ? element : <Navigate to="/login" replace />;
    };

    const AuthRoute = ({ element }) => {
        return user ? <Navigate to="/" replace /> : element;
    };

    return (
        <Routes>
            <Route element={<AuthLayout />}>
                <Route path="/login" element={<AuthRoute element={<Login onLoginSuccess={onSetUser} />} />} />
                <Route path="/signup" element={<AuthRoute element={<Signup />} />} />
            </Route>

            <Route element={<MainLayout user={user} onLogout={onLogout} />}>
                <Route path="/" element={<ProtectedRoute element={<Landing user={user} />} />} />
                <Route path="/users" element={<ProtectedRoute element={<UserManagement />} />} />
                <Route path="/facilities" element={<ProtectedRoute element={<Facilities />} />} />
                <Route path="/bookings" element={<ProtectedRoute element={<Bookings />} />} />
                <Route path="/tickets" element={<ProtectedRoute element={<Tickets />} />} />
                <Route path="/notifications" element={<ProtectedRoute element={<Notifications />} />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}