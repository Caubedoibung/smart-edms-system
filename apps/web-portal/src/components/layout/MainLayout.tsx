import { useState, useEffect } from "react";
import { Sidebar } from "./Sidebar";
import type { UserRole } from "../../lib/types";
import { FileExplorer } from "../../pages/FileExplorer";
import { PlaceholderPage } from "../../pages/PlaceholderPage";
import { useLocation, useNavigate, useSearchParams } from "react-router";

export interface AppNotification {
    id: string;
    title: string;
    message: string;
    type: 'info' | 'warning' | 'error' | 'success';
    time: string;
    isRead: boolean;
}

export function MainLayout() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams, setSearchParams] = useSearchParams();

    // Initialize from localStorage
    const [currentUser] = useState<any>(() => {
        const stored = localStorage.getItem('user');
        return stored ? JSON.parse(stored) : { id: "1", role: "MANAGER", name: "Mock User", email: "mock@mock.com", department: "IT", avatar: "", status: "active" }; // Fallback for dev mode
    });

    const currentRole: UserRole = currentUser?.role || 'STAFF';
    
    const currentFolderId = searchParams.get('folder');

    // --- REAL NOTIFICATIONS SYSTEM ---
    const [notifications] = useState<AppNotification[]>([
        { id: '1', title: 'Tài liệu mới', message: 'Tài liệu "Quy_Trinh_Bao_Mat_2024.pdf" vừa được tải lên kho phòng ban.', type: 'info', time: 'Vừa xong', isRead: false },
        { id: '2', title: 'Cần phê duyệt', message: 'Bạn có 3 hợp đồng đang chờ chữ ký số.', type: 'warning', time: '1 giờ trước', isRead: false },
        { id: '3', title: 'Thành công', message: 'Tiến trình sao lưu dữ liệu hệ thống đã hoàn tất.', type: 'success', time: '2 giờ trước', isRead: true },
    ]);

    // --- SECURITY: ADMIN CANNOT ACCESS PERSONAL FILES ---
    useEffect(() => {
        if (currentRole === 'ADMIN' && location.pathname === '/dashboard/files') {
            navigate('/dashboard', { replace: true });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentRole, location.pathname]);

    const handleFolderChange = (id: string | null) => {
        if (id) setSearchParams({ folder: id });
        else {
            if (location.pathname === '/dashboard/department') setSearchParams({ folder: 'dept_root' });
            else setSearchParams({});
        }
    };

    useEffect(() => {
        if (location.pathname === '/dashboard/department' && !searchParams.get('folder')) {
            setSearchParams({ folder: 'dept_root' });
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location.pathname]);

    const renderContent = () => {
        if (location.pathname === '/dashboard/files') {
            if (currentRole === 'ADMIN') return <PlaceholderPage title="Dashboard Admin" />;
            return <FileExplorer title="Tài liệu cá nhân" currentFolderId={currentFolderId} onFolderChange={handleFolderChange} ownerId={currentUser.id} />;
        }
        
        if (location.pathname === '/dashboard/department') {
            return <FileExplorer title="Kho phòng ban" currentFolderId={currentFolderId} onFolderChange={handleFolderChange} ownerId={null} user={currentUser} />;
        }

        if (location.pathname === '/dashboard/recycle-bin') return <PlaceholderPage title="Thùng rác" />;
        if (location.pathname === '/dashboard/audit-logs') return <PlaceholderPage title="Nhật ký Hệ thống" />;
        if (location.pathname === '/dashboard/approvals') return <PlaceholderPage title="Quản lý Phê duyệt" />;
        if (location.pathname === '/dashboard/signatures') return <PlaceholderPage title="Quản lý Chữ ký" />;
        if (location.pathname === '/dashboard/users') return <PlaceholderPage title="Quản lý Người dùng" />;
        if (location.pathname === '/dashboard/storage') return <PlaceholderPage title="Quản lý Lưu trữ" />;
        if (location.pathname === '/dashboard/settings') return <PlaceholderPage title="Cài đặt Hệ thống" />;
        
        return <PlaceholderPage title={`Trang Tổng quan (${currentRole})`} />;
    };

    return (
        <div className="flex h-screen overflow-hidden selection:bg-primary/20 selection:text-primary transition-colors duration-300 bg-slate-50 dark:bg-slate-950 relative">
            
            {/* Sidebar is now always visible */}
            <Sidebar role={currentRole} user={currentUser} notifications={notifications} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
                <main className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth relative z-10 pt-8">
                    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-1000">
                        {renderContent()}
                    </div>
                </main>
            </div>

            {/* Cyber Background */}
            <div className="fixed inset-0 pointer-events-none opacity-20 overflow-hidden -z-10">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary/20 blur-[150px] animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/20 blur-[150px] animate-pulse" />
            </div>
        </div>
    );
}
