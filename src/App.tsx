import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./screens/Home";
import Store from "./screens/Store";
import Wishlist from "./screens/Wishlist";
import Transactions from "./screens/Transactions";
import Trade from "./screens/Trade";
import Help from "./screens/Help";
import Library from "./screens/Library";
import { AppDataProvider } from "./contexts/AppDataContext";
import Cart from "./screens/Cart";
import AdminGameUpload from "./screens/AdminGameUpload";
import { ToastContainer } from "react-toastify";

export default function App() {
  return (
    <AppDataProvider>
      <BrowserRouter>
        <ToastContainer
          position="top-right"
          autoClose={3000}
          theme="dark"
          toastClassName="bg-gray-900 text-cyan-200 border border-cyan-700 shadow-lg"
          closeButton={false}
          
        />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<Library />} />
          <Route path="/store" element={<Store />} />
          <Route path="/wishlist" element={<Wishlist />} />
          <Route path="/trade" element={<Trade />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/help" element={<Help />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/admin" element={<AdminGameUpload />} />
        </Routes>
      </BrowserRouter>
    </AppDataProvider>
  );
}
