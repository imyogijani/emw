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
  apiKey: "AIzaSyBNBplIKMtXjzaHjSg1HzF1JST60XYTh7g",
  authDomain: "ecom-emall-world.firebaseapp.com",
  projectId: "ecom-emall-world",
  storageBucket: "ecom-emall-world.appspot.com",
  messagingSenderId: "422412652929",
  appId: "1:422412652929:web:eeb1d855719ba22cd4d880",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log("🔕 Background message received:", payload);
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
  });
});
