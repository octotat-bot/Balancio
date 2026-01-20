import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    LayoutDashboard,
    Users,
    User,
    LogOut,
    Menu,
    X,
    Plus,
    Sparkles,
    Wallet,
    UserPlus,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { Avatar } from './ui/Avatar';
import { useChatStore } from '../stores/chatStore';

const navItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/groups', icon: Users, label: 'Groups' },
    { path: '/friends', icon: UserPlus, label: 'Friends' },
    { path: '/settlements', icon: Wallet, label: 'Settlements' },
    { path: '/profile', icon: User, label: 'Profile' },
];

const sidebarVariants = {
    hidden: { x: -280, opacity: 0 },
    visible: {
        x: 0,
        opacity: 1,
        transition: { type: "spring", stiffness: 100, damping: 20 }
    },
};

const navItemVariants = {
    hidden: { x: -20, opacity: 0 },
    visible: (i) => ({
        x: 0,
        opacity: 1,
        transition: { delay: i * 0.1, duration: 0.3 }
    }),
};

const mobileMenuVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: 0.2 } },
    exit: { opacity: 0, transition: { duration: 0.2 } },
};

const mobileSidebarVariants = {
    hidden: { x: '-100%' },
    visible: { x: 0, transition: { type: "spring", stiffness: 300, damping: 30 } },
    exit: { x: '-100%', transition: { duration: 0.2 } },
};

const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.4 } },
    exit: { opacity: 0, y: -20, transition: { duration: 0.2 } },
};

export function Layout() {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const { user, logout } = useAuthStore();
    const { connect, joinUserRoom, disconnect } = useChatStore();
    const navigate = useNavigate();
    const location = useLocation();

    // Initialize real-time connection
    React.useEffect(() => {
        if (user?._id) {
            connect();
            joinUserRoom(user._id);
        }
        return () => disconnect();
    }, [user?._id]);

    const handleLogout = () => {
        logout();
        navigate('/auth');
    };

    const NavItem = ({ item, index, onClick }) => {
        const isActive = location.pathname === item.path ||
            (item.path === '/groups' && location.pathname.startsWith('/groups'));

        return (
            <motion.div
                custom={index}
                variants={navItemVariants}
                initial="hidden"
                animate="visible"
            >
                <NavLink
                    to={item.path}
                    onClick={onClick}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        fontSize: '15px',
                        fontWeight: isActive ? '600' : '500',
                        color: isActive ? '#000' : '#525252',
                        backgroundColor: isActive ? '#f5f5f5' : 'transparent',
                        transition: 'all 0.2s ease',
                        textDecoration: 'none',
                    }}
                    onMouseEnter={(e) => {
                        if (!isActive) e.target.style.backgroundColor = '#fafafa';
                    }}
                    onMouseLeave={(e) => {
                        if (!isActive) e.target.style.backgroundColor = 'transparent';
                    }}
                >
                    <item.icon style={{ width: '20px', height: '20px' }} />
                    {item.label}
                </NavLink>
            </motion.div>
        );
    };

    return (
        <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fafafa' }}>
            {/* Desktop Sidebar */}
            <motion.aside
                variants={sidebarVariants}
                initial="hidden"
                animate="visible"
                className="hidden lg:flex"
                style={{
                    width: '280px',
                    backgroundColor: '#ffffff',
                    borderRight: '1px solid #e5e5e5',
                    flexDirection: 'column',
                    padding: '24px',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    bottom: 0,
                    zIndex: 40,
                }}
            >
                {/* Logo */}
                <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}
                >
                    <motion.div
                        whileHover={{ rotate: 180 }}
                        transition={{ duration: 0.5 }}
                        style={{
                            width: '44px',
                            height: '44px',
                            backgroundColor: '#000',
                            borderRadius: '12px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                    >
                        <Sparkles style={{ width: '22px', height: '22px', color: '#fff' }} />
                    </motion.div>
                    <span style={{ fontSize: '24px', fontWeight: '700', letterSpacing: '-0.02em' }}>Balancio</span>
                </motion.div>

                {/* Quick Action */}
                <motion.button
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.3, type: "spring" }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/groups/new')}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        padding: '14px',
                        backgroundColor: '#000',
                        color: '#fff',
                        borderRadius: '12px',
                        fontSize: '15px',
                        fontWeight: '600',
                        border: 'none',
                        cursor: 'pointer',
                        marginBottom: '24px',
                    }}
                >
                    <Plus style={{ width: '18px', height: '18px' }} />
                    New Group
                </motion.button>

                {/* Navigation */}
                <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    {navItems.map((item, index) => (
                        <NavItem key={item.path} item={item} index={index} />
                    ))}
                </nav>

                {/* User Section */}
                <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '16px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '12px',
                    }}
                >
                    <Avatar name={user?.name} src={user?.avatar} size="md" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: '600', fontSize: '14px', color: '#0a0a0a', margin: 0 }}>
                            {user?.name || 'User'}
                        </p>
                        <p style={{ fontSize: '13px', color: '#737373', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {user?.email}
                        </p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleLogout}
                        style={{
                            padding: '8px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            color: '#737373',
                        }}
                    >
                        <LogOut style={{ width: '18px', height: '18px' }} />
                    </motion.button>
                </motion.div>
            </motion.aside>

            {/* Mobile Header */}
            <motion.header
                initial={{ y: -60 }}
                animate={{ y: 0 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="lg:hidden"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '64px',
                    backgroundColor: '#ffffff',
                    borderBottom: '1px solid #e5e5e5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 16px',
                    zIndex: 50,
                }}
            >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '36px',
                        height: '36px',
                        backgroundColor: '#000',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}>
                        <Sparkles style={{ width: '18px', height: '18px', color: '#fff' }} />
                    </div>
                    <span style={{ fontSize: '20px', fontWeight: '700' }}>Balancio</span>
                </div>
                <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                    style={{
                        padding: '8px',
                        backgroundColor: 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                    }}
                >
                    {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
                </motion.button>
            </motion.header>

            {/* Mobile Menu Overlay */}
            <AnimatePresence>
                {isMobileMenuOpen && (
                    <>
                        <motion.div
                            variants={mobileMenuVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            onClick={() => setIsMobileMenuOpen(false)}
                            style={{
                                position: 'fixed',
                                inset: 0,
                                backgroundColor: 'rgba(0,0,0,0.5)',
                                zIndex: 45,
                            }}
                            className="lg:hidden"
                        />
                        <motion.div
                            variants={mobileSidebarVariants}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                            className="lg:hidden"
                            style={{
                                position: 'fixed',
                                top: 0,
                                left: 0,
                                bottom: 0,
                                width: '280px',
                                backgroundColor: '#fff',
                                zIndex: 50,
                                padding: '24px',
                                display: 'flex',
                                flexDirection: 'column',
                            }}
                        >
                            {/* Mobile Sidebar Content */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' }}>
                                <div style={{
                                    width: '44px',
                                    height: '44px',
                                    backgroundColor: '#000',
                                    borderRadius: '12px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}>
                                    <Sparkles style={{ width: '22px', height: '22px', color: '#fff' }} />
                                </div>
                                <span style={{ fontSize: '24px', fontWeight: '700' }}>Balancio</span>
                            </div>

                            <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                {navItems.map((item, index) => (
                                    <NavItem
                                        key={item.path}
                                        item={item}
                                        index={index}
                                        onClick={() => setIsMobileMenuOpen(false)}
                                    />
                                ))}
                            </nav>

                            <button
                                onClick={handleLogout}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '12px',
                                    padding: '12px 16px',
                                    color: '#dc2626',
                                    backgroundColor: 'transparent',
                                    border: 'none',
                                    borderRadius: '12px',
                                    fontSize: '15px',
                                    fontWeight: '500',
                                    cursor: 'pointer',
                                }}
                            >
                                <LogOut style={{ width: '20px', height: '20px' }} />
                                Logout
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Main Content */}
            <main
                style={{
                    flex: 1,
                    marginLeft: '0',
                    marginTop: '64px',
                    padding: '16px',
                    paddingBottom: '100px',
                    minHeight: 'calc(100vh - 64px)',
                }}
                className="lg:ml-[280px] lg:mt-0 lg:min-h-screen"
            >
                <motion.div
                    key={location.pathname}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2 }}
                    style={{ maxWidth: '1200px', margin: '0 auto' }}
                >
                    <Outlet />
                </motion.div>
            </main>

            {/* Mobile Bottom Navigation */}
            <motion.nav
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 100 }}
                className="lg:hidden"
                style={{
                    position: 'fixed',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    height: '72px',
                    backgroundColor: '#ffffff',
                    borderTop: '1px solid #e5e5e5',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-around',
                    padding: '0 16px',
                    zIndex: 40,
                }}
            >
                {navItems.map((item) => {
                    const isActive = location.pathname === item.path ||
                        (item.path === '/groups' && location.pathname.startsWith('/groups'));

                    return (
                        <NavLink
                            key={item.path}
                            to={item.path}
                            style={{
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '4px',
                                padding: '8px 16px',
                                color: isActive ? '#000' : '#a3a3a3',
                                textDecoration: 'none',
                                transition: 'color 0.2s ease',
                            }}
                        >
                            <motion.div
                                whileTap={{ scale: 0.9 }}
                                style={{
                                    padding: '8px',
                                    borderRadius: '12px',
                                    backgroundColor: isActive ? '#f5f5f5' : 'transparent',
                                }}
                            >
                                <item.icon style={{ width: '22px', height: '22px' }} />
                            </motion.div>
                            <span style={{ fontSize: '11px', fontWeight: isActive ? '600' : '500' }}>
                                {item.label}
                            </span>
                        </NavLink>
                    );
                })}
            </motion.nav>
        </div>
    );
}

export default Layout;
