// src/layout/Layout.jsx
import Sidebar from "./Sidebar";

const Layout = ({ children }) => {
  return (
    <div className="flex">
      <Sidebar />
      <main className="ml-64 p-6 w-full bg-gray-100 min-h-screen">{children}</main>
    </div>
  );
};

export default Layout;
