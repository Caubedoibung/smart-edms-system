import { createBrowserRouter, RouterProvider, Navigate } from "react-router";
import { Login } from "./pages/Login";

function Dashboard() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-background text-foreground">
      <h1 className="text-3xl font-bold">Dashboard (Protected)</h1>
    </div>
  );
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <Login />,
  },
  {
    path: "/dashboard",
    element: <Dashboard />,
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;
