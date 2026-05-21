import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/Layout";
import { AdminLayout } from "./components/AdminLayout";
import { Home } from "./pages/Home";
import { Shop } from "./pages/Shop";
import { ProductDetail } from "./pages/ProductDetail";
import { Cart } from "./pages/Cart";
import { Checkout } from "./pages/Checkout";
import { Login } from "./pages/Login";
import { Account } from "./pages/Account";
import { OrderConfirmation } from "./pages/OrderConfirmation";
import { Wishlist } from "./pages/Wishlist";
import { Rooms } from "./pages/Rooms";
import { RoomDetail } from "./pages/RoomDetail";
import { ServicePageDetail } from "./pages/ServicePageDetail";
import { Inspiration } from "./pages/Inspiration";
import { StoryDetail } from "./pages/StoryDetail";
import { StylingSessions } from "./pages/StylingSessions";
import { Care } from "./pages/Care";
import { Professionals } from "./pages/Professionals";
import { AdminProducts } from "./pages/AdminProducts";
import { AdminRooms } from "./pages/AdminRooms";
import { AdminProfessionals } from "./pages/AdminProfessionals";
import { AdminServicePages } from "./pages/AdminServicePages";
import { AdminStories } from "./pages/AdminStories";
import { AdminRevenue } from "./pages/AdminRevenue";
import { AdminCustomers } from "./pages/AdminCustomers";
import { AdminOrders } from "./pages/AdminOrders";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Layout,
    children: [
      { index: true, Component: Home },
      { path: "shop", Component: Shop },
      { path: "shop/:category", Component: Shop },
      { path: "products", Component: Shop },
      { path: "product/:id", Component: ProductDetail },
      { path: "cart", Component: Cart },
      { path: "checkout", Component: Checkout },
      { path: "order-confirmation/:orderNumber", Component: OrderConfirmation },
      { path: "login", Component: Login },
      { path: "account", Component: Account },
      { path: "wishlist", Component: Wishlist },
      { path: "rooms", Component: Rooms },
      { path: "rooms/:id", Component: RoomDetail },
      { path: "inspire", Component: Inspiration },
      { path: "stories", Component: Inspiration },
      { path: "inspiration", Component: Inspiration },
      { path: "inspiration/:id", Component: StoryDetail },
      { path: "styling", Component: StylingSessions },
      { path: "care", Component: Care },
      { path: "service/:slug", Component: ServicePageDetail },
      { path: "professionals", Component: Professionals },
      {
        path: "admin",
        Component: AdminLayout,
        children: [
          { index: true, element: <Navigate to="revenue" replace /> },
          { path: "revenue", Component: AdminRevenue },
          { path: "orders", Component: AdminOrders },
          { path: "products", Component: AdminProducts },
          { path: "customers", Component: AdminCustomers },
          { path: "rooms", Component: AdminRooms },
          { path: "professionals", Component: AdminProfessionals },
          { path: "customer-service", Component: AdminServicePages },
          { path: "inspire", Component: AdminStories },
        ],
      },
    ],
  },
]);
