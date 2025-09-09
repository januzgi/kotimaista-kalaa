import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { CartProvider } from './contexts/CartContext'
import { NotificationProvider } from './contexts/NotificationContext'

createRoot(document.getElementById("root")!).render(
  <NotificationProvider>
    <CartProvider>
      <App />
    </CartProvider>
  </NotificationProvider>
);
