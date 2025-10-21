import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { CartProvider } from "./contexts/CartContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { AuthProvider } from "./contexts/AuthContext.tsx";

/**
 * Application entry point that renders the React app with necessary context providers.
 *
 * The app is wrapped with:
 * - NotificationProvider: Manages admin notifications for new orders
 * - CartProvider: Manages shopping cart state across the application
 *
 * These providers must be in this order to ensure proper dependency injection.
 */
createRoot(document.getElementById("root")!).render(
  <AuthProvider>
    <NotificationProvider>
      <CartProvider>
        <App />
      </CartProvider>
    </NotificationProvider>
  </AuthProvider>
);
