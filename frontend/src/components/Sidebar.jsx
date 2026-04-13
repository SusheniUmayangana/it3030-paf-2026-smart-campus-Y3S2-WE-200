import { NavLink } from 'react-router-dom';

export default function Sidebar() {
    const links = [
        { name: 'Dashboard', path: '/' },
        { name: 'User Management', path: '/users' },
        { name: 'Facilities', path: '/facilities' },
        { name: 'Bookings', path: '/bookings' },
        { name: 'Tickets', path: '/tickets' },
        { name: 'Notifications', path: '/notifications' },
    ];

    return (
        <aside className="w-64 glass !rounded-none border-y-0 border-l-0 min-h-[calc(100vh-72px)] py-6 px-4 flex flex-col gap-2 relative z-20">
            <div className="text-xs font-semibold text-surface-500 uppercase tracking-wider mb-2 ml-2">
                Menu
            </div>
            <nav className="flex flex-col gap-1.5">
                {links.map((link) => (
                    <NavLink
                        key={link.name}
                        to={link.path}
                        className={({ isActive }) =>
                            `px-4 py-2.5 rounded-xl text-sm font-medium transition-all flex items-center gap-3 ${isActive
                                ? 'bg-primary-500/10 text-primary-400 border border-primary-500/20 shadow-sm'
                                : 'text-surface-400 hover:text-surface-200 hover:bg-surface-800/50'
                            }`
                        }
                    >
                        {link.name}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}