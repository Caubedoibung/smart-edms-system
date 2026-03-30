import { createBrowserRouter, RouterProvider, Navigate } from "react-router";
import { GooeyToaster } from "goey-toast";
import "goey-toast/styles.css";

import { Login } from "./pages/Login";
import { MainLayout } from "./components/layout/MainLayout";
// Import các trang cần thiết
import { PlaceholderPage } from "./pages/PlaceholderPage";
const router = createBrowserRouter([
    {
        path: "/",
        element: <Login />,
    },
    {
        path: "/dashboard",
        element: <MainLayout />,
        children: [
            {
                index: true,
                element: <PlaceholderPage title="Dashboard Tổng quan" />,
            },
            {
                path: "files",
                element: null, // Dành riêng spotlight cho task EDMS-50
            },
            {
                path: "department",
                element: <PlaceholderPage title="Quản lý Phòng ban" />,
            },
            {
                path: "recycle-bin",
                element: <PlaceholderPage title="Thùng rác" />,
            },
            {
                path: "audit-logs",
                element: <PlaceholderPage title="Nhật ký Hệ thống (Audit Logs)" />,
            },
            {
                path: "approvals",
                element: <PlaceholderPage title="Quản lý Phê duyệt" />,
            },
            {
                path: "signatures",
                element: <PlaceholderPage title="Quản lý Chữ ký" />,
            },
            {
                path: "users",
                element: <PlaceholderPage title="Quản lý Người dùng" />,
            },
            {
                path: "storage",
                element: <PlaceholderPage title="Quản lý Lưu trữ" />,
            },
            {
                path: "settings",
                element: <PlaceholderPage title="Cài đặt Hệ thống" />,
            },
        ]
    },
    {
        path: "*",
        element: <Navigate to="/" replace />,
    }
]);

function App() {
    return (
        <>
            <RouterProvider router={router} />
            <GooeyToaster 
                position="bottom-right"
                toastOptions={{
                    className: "glass-panel bg-white/80 backdrop-blur-xl border border-white/60 shadow-[0_8px_32px_rgba(99,102,241,0.15)] font-bold",
                    style: {
                        borderRadius: "24px",
                    }
                }}
            />
        </>
    );
}
export default App;
