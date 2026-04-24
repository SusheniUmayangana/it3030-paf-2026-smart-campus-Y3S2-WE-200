import { Routes, Route, Navigate } from 'react-router-dom';
import MainLayout from '../layouts/MainLayout';
import AuthLayout from '../layouts/AuthLayout';

import Login from '../pages/Login';
import Signup from '../pages/Signup';
import Landing from '../pages/Landing';
import UserManagement from '../pages/UserManagement';
import Profile from '../pages/Profile';
import Facilities from '../pages/Facilities';
import Bookings from '../pages/Bookings';
import BookingForm from '../pages/BookingForm';
import Tickets from '../pages/Tickets';
import Notifications from '../pages/Notifications';

export default function AppRoutes({ user, onSetUser, onLogout }) {
    const ProtectedRoute = ({ element }) => {
        return user ? element : <Navigate to="/login" replace />;
    };

    const AuthRoute = ({ element }) => {
        return user ? <Navigate to="/" replace /> : element;
    };

    const AdminRoute = ({ element }) => {
        if (!user) return <Navigate to="/login" replace />;
        if (user.role !== 'ADMIN' && user.role !== 'SUPER_ADMIN' && user.role !== 'SUPER ADMIN') return <Navigate to="/" replace />;
        return element;
    };

    return (
        <Routes>
            <Route element={<AuthLayout />}>
                <Route path="/login" element={<AuthRoute element={<Login onLoginSuccess={onSetUser} />} />} />
                <Route path="/signup" element={<AuthRoute element={<Signup />} />} />
            </Route>

            <Route element={<MainLayout user={user} onLogout={onLogout} />}>
                <Route path="/" element={<ProtectedRoute element={<Landing user={user} />} />} />
                <Route path="/users" element={<AdminRoute element={<UserManagement user={user} />} />} />
                <Route path="/profile" element={<ProtectedRoute element={<Profile user={user} onUserUpdate={(updated) => onSetUser({ ...user, ...updated })} />} />} />
                <Route path="/facilities" element={<ProtectedRoute element={<Facilities user={user} />} />} />
                <Route path="/bookings" element={<ProtectedRoute element={<Bookings />} />} />
                <Route path="/tickets" element={<ProtectedRoute element={<Tickets user={user} />} />} />
                <Route path="/notifications" element={<ProtectedRoute element={<Notifications />} />} />
                <Route path="/booking/:resourceId" element={<ProtectedRoute element={<BookingForm user={user} />} />} />
                <Route path="/bookings" element={<ProtectedRoute element={<Bookings user={user} />} />} />
                <Route path="/tickets" element={<ProtectedRoute element={<Tickets />} />} />
                <Route path="/notifications" element={<ProtectedRoute element={<Notifications user={user} />} />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    );
}