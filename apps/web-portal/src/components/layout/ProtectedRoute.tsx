import { Navigate, Outlet } from "react-router";

export function ProtectedRoute() {
    const userStr = localStorage.getItem("user");
    const user = userStr ? JSON.parse(userStr) : null;

    if (!user) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}