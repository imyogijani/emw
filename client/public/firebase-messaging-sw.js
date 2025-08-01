/* eslint-disable no-undef */
/* eslint-env serviceworker */
/* global firebase */
importScripts(
  "https://www.gstatic.com/firebasejs/10.11.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.11.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "YOUR_API_KEY",
  authDomain: "your-project.firebaseapp.com",
  projectId: "your-project-id",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("🔕 Background message received:", payload);
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
  });
});
