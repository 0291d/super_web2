import { lazy } from "react";
import { createBrowserRouter, Navigate } from "react-router";
import { Layout } from "./components/Layout";

const Home = lazy(() => import("./pages/Home").then((module) => ({ default: module.Home })));
const Shop = lazy(() => import("./pages/Shop").then((module) => ({ default: module.Shop })));
const ProductDetail = lazy(() => import("./pages/ProductDetail").then((module) => ({ default: module.ProductDetail })));
const Cart = lazy(() => import("./pages/Cart").then((module) => ({ default: module.Cart })));
const Checkout = lazy(() => import("./pages/Checkout").then((module) => ({ default: module.Checkout })));
const Login = lazy(() => import("./pages/Login").then((module) => ({ default: module.Login })));
const Account = lazy(() => import("./pages/Account").then((module) => ({ default: module.Account })));
const OrderConfirmation = lazy(() => import("./pages/OrderConfirmation").then((module) => ({ default: module.OrderConfirmation })));
const Wishlist = lazy(() => import("./pages/Wishlist").then((module) => ({ default: module.Wishlist })));
const Rooms = lazy(() => import("./pages/Rooms").then((module) => ({ default: module.Rooms })));
const RoomDetail = lazy(() => import("./pages/RoomDetail").then((module) => ({ default: module.RoomDetail })));
const ServicePageDetail = lazy(() => import("./pages/ServicePageDetail").then((module) => ({ default: module.ServicePageDetail })));
const Inspiration = lazy(() => import("./pages/Inspiration").then((module) => ({ default: module.Inspiration })));
const StoryDetail = lazy(() => import("./pages/StoryDetail").then((module) => ({ default: module.StoryDetail })));
const StylingSessions = lazy(() => import("./pages/StylingSessions").then((module) => ({ default: module.StylingSessions })));
const Care = lazy(() => import("./pages/Care").then((module) => ({ default: module.Care })));
const Professionals = lazy(() => import("./pages/Professionals").then((module) => ({ default: module.Professionals })));
const AdminLayout = lazy(() => import("./components/AdminLayout").then((module) => ({ default: module.AdminLayout })));
const AdminProducts = lazy(() => import("./pages/AdminProducts").then((module) => ({ default: module.AdminProducts })));
const AdminRooms = lazy(() => import("./pages/AdminRooms").then((module) => ({ default: module.AdminRooms })));
const AdminProfessionals = lazy(() => import("./pages/AdminProfessionals").then((module) => ({ default: module.AdminProfessionals })));
const AdminProjectInquiries = lazy(() => import("./pages/AdminProjectInquiries").then((module) => ({ default: module.AdminProjectInquiries })));
const AdminServicePages = lazy(() => import("./pages/AdminServicePages").then((module) => ({ default: module.AdminServicePages })));
const AdminStories = lazy(() => import("./pages/AdminStories").then((module) => ({ default: module.AdminStories })));
const AdminRevenue = lazy(() => import("./pages/AdminRevenue").then((module) => ({ default: module.AdminRevenue })));
const AdminCustomers = lazy(() => import("./pages/AdminCustomers").then((module) => ({ default: module.AdminCustomers })));
const AdminOrders = lazy(() => import("./pages/AdminOrders").then((module) => ({ default: module.AdminOrders })));
const AdminAccounts = lazy(() => import("./pages/AdminAccounts").then((module) => ({ default: module.AdminAccounts })));
const WarehouseLayout = lazy(() => import("./components/WarehouseLayout").then((module) => ({ default: module.WarehouseLayout })));
const WarehouseInventory = lazy(() => import("./pages/WarehouseInventory").then((module) => ({ default: module.WarehouseInventory })));
const WarehouseReceipts = lazy(() => import("./pages/WarehouseReceipts").then((module) => ({ default: module.WarehouseReceipts })));
const WarehouseIssues = lazy(() => import("./pages/WarehouseIssues").then((module) => ({ default: module.WarehouseIssues })));
const WarehouseCounts = lazy(() => import("./pages/WarehouseCounts").then((module) => ({ default: module.WarehouseCounts })));
const WarehouseHistory = lazy(() => import("./pages/WarehouseHistory").then((module) => ({ default: module.WarehouseHistory })));
const AccountantLayout = lazy(() => import("./components/AccountantLayout").then((module) => ({ default: module.AccountantLayout })));
const AccountantJournals = lazy(() => import("./pages/AccountantJournals").then((module) => ({ default: module.AccountantJournals })));
const AccountantReconciliations = lazy(() => import("./pages/AccountantReconciliations").then((module) => ({ default: module.AccountantReconciliations })));
const AccountantAdjustments = lazy(() => import("./pages/AccountantAdjustments").then((module) => ({ default: module.AccountantAdjustments })));
const AccountantExceptions = lazy(() => import("./pages/AccountantExceptions").then((module) => ({ default: module.AccountantExceptions })));

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
          { path: "accounts", Component: AdminAccounts },
          { path: "rooms", Component: AdminRooms },
          { path: "professionals", Component: AdminProfessionals },
          { path: "project-inquiries", Component: AdminProjectInquiries },
          { path: "customer-service", Component: AdminServicePages },
          { path: "inspire", Component: AdminStories },
        ],
      },
      {
        path: "warehouse",
        Component: WarehouseLayout,
        children: [
          { index: true, element: <Navigate to="inventory" replace /> },
          { path: "inventory", Component: WarehouseInventory },
          { path: "receipts", Component: WarehouseReceipts },
          { path: "issues", Component: WarehouseIssues },
          { path: "counts", Component: WarehouseCounts },
          { path: "history", Component: WarehouseHistory },
        ],
      },
      {
        path: "accountant",
        Component: AccountantLayout,
        children: [
          { index: true, element: <Navigate to="journals" replace /> },
          { path: "journals", Component: AccountantJournals },
          { path: "reconciliations", Component: AccountantReconciliations },
          { path: "adjustments", Component: AccountantAdjustments },
          { path: "exceptions", Component: AccountantExceptions },
        ],
      },
    ],
  },
]);
