import { Routes, Route } from "react-router";
import Signup from "./pages/Signup";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/Notfound";
import Products from "./pages/Products";
import Cart from "./pages/Cart";
import OrderConfirmation from "./pages/OrderConfirmation";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/signup" element={<Signup />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/products" element={<Products />} />
      <Route path="/cart" element={<Cart />} />
      <Route path="/order-confirmation" element={<OrderConfirmation />} />
      <Route path="*" element={<NotFound />} /> {/* 404 Route */}
    </Routes>
  );
}

export default App;
