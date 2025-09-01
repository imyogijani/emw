import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "./theme.css";
import "./button-system.css";
import App from "./App.jsx";
import { ThemeProvider } from "./ThemeContext";

// Register Firebase messaging service worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then((registration) => {
      console.log('✅ Firebase SW registered:', registration);
    })
    .catch((error) => {
      console.error('❌ Firebase SW registration failed:', error);
    });
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <ThemeProvider>
      <App />
    </ThemeProvider>
  </StrictMode>
);
