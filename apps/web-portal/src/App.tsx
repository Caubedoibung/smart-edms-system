import { createBrowserRouter, RouterProvider, Navigate } from "react-router";
import { GooeyToaster } from "goey-toast";
import "goey-toast/styles.css";

import { Login } from "./pages/Login";
import { MainLayout } from "./components/layout/MainLayout";
import { ProtectedRoute } from "./components/layout/ProtectedRoute";
// Import các trang cần thiết
import { PlaceholderPage } from "./pages/PlaceholderPage";
import { Settings } from "./pages/Settings";
import { Approvals } from "./pages/Approvals";
import { UserManagement } from "./pages/UserManagement";
import { SignatureManagement } from "./pages/SignatureManagement";
import { RecycleBin } from "./pages/RecycleBin";
import { SystemLogs } from "./pages/SystemLogs";
import { StorageManagement } from "./pages/StorageManagement";

const router = createBrowserRouter([
    {
        path: "/",
        element: <Login />,
    },
    {
        path: "/dashboard",
        element: <ProtectedRoute />,
        children: [
            {
                element: <MainLayout />,
                children: [
                    {
                        index: true,
                        element: null, // Routed in MainLayout
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
                        element: <RecycleBin />,
                    },
                    {
                        path: "audit-logs",
                        element: <SystemLogs />,
                    },
                    {
                        path: "approvals",
                        element: <Approvals />,
                    },
                    {
                        path: "signatures",
                        element: <SignatureManagement />,
                    },
                    {
                        path: "users",
                        element: <UserManagement />,
                    },
                    {
                        path: "storage",
                        element: <StorageManagement />,
                    },
                    {
                        path: "settings",
                        element: <Settings />,
                    },
                ]
            }
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
                duration={4000}
                theme="light"
                richColors
                visibleToasts={5}
                closeButton
            />
        </>
    );
}
export default App;
