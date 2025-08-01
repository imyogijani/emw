// src/firebase/firebase.js
import { initializeApp } from "firebase/app";
import { getMessaging, isSupported } from "firebase/messaging";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBNBplIKMtXjzaHjSg1HzF1JST60XYTh7g",
  authDomain: "ecom-emall-world.firebaseapp.com",
  projectId: "ecom-emall-world",
  storageBucket: "ecom-emall-world.appspot.com",
  messagingSenderId: "422412652929",
  appId: "1:422412652929:web:eeb1d855719ba22cd4d880",
};

const app = initializeApp(firebaseConfig);
let messaging = null;

// Initialize messaging with support check
isSupported().then((supported) => {
  if (supported) {
    messaging = getMessaging(app);
    console.log("Firebase Messaging initialized");
  } else {
    console.warn("Firebase Messaging is not supported in this browser");
  }
});

const auth = getAuth(app);

export { app, messaging, auth, createUserWithEmailAndPassword, sendEmailVerification };