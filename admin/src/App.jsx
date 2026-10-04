import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import AdminLayout from './layouts/AdminLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Products from './pages/Products';
import Categories from './pages/Categories';
import HeroImages from './pages/HeroImages';
import Membership from './pages/Membership';
import SiteSettings from './pages/SiteSettings';
import Orders, { OrderDetail } from './pages/Orders';
import Reviews from './pages/Reviews';
import Users from './pages/Users';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: { borderRadius: '10px', background: '#111', color: '#fff' },
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="hero" element={<HeroImages />} />
            <Route path="products" element={<Products productType="general" />} />
            <Route path="categories" element={<Categories categoryType="general" />} />
            <Route path="membership" element={<Membership />} />
            <Route path="site" element={<SiteSettings />} />
            <Route path="orders" element={<Orders />} />
            <Route path="orders/:id" element={<OrderDetail />} />
            <Route path="reviews" element={<Reviews />} />
            <Route path="users" element={<Users />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
