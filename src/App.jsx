import CreateTask from "./pages/CreateTask";
import './App.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Register from "./pages/Register";
import Layout from "./layout/Layout";
import RequireAuth from "./context/RequireAuth";
import Tasks from "./pages/Tasks"; 
import Dashboard from "./pages/Dashboard";
import { NotificationProvider } from "./context/NotificationContext";
import NotificationsPage from "./pages/Notifications";


function App() {
  return (
    <NotificationProvider>
      <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />


        {/* Protected routes */}
       <Route
  path="/dashboard"
  element={
    <RequireAuth>
      <Layout>
        <Dashboard />
      </Layout>
    </RequireAuth>
  }
/>
        <Route
  path="/create"
  element={
    <RequireAuth>
      <Layout>
        <CreateTask />
      </Layout>
    </RequireAuth>
  }
/>


        <Route
  path="/tasks"
  element={
    <RequireAuth>
      <Layout>
        <Tasks />
      </Layout>
    </RequireAuth>
  }
/>

<Route
  path="/notifications"
  element={
    <RequireAuth>
      <Layout>
        <NotificationsPage />
      </Layout>
    </RequireAuth>
  }
/>
        
      </Routes>
      
    </BrowserRouter>
    </NotificationProvider>
 
  );
}

export default App
