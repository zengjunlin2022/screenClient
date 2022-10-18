/**
 * Here is is the code snippet to initialize Firebase Messaging in the Service
 * Worker when your app is not hosted on Firebase Hosting.
 // Give the service worker access to Firebase Messaging.
 // Note that you can only use Firebase Messaging here. Other Firebase libraries
 // are not available in the service worker.
 **/
importScripts(
  "https://www.gstatic.com/firebasejs/9.2.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/9.2.0/firebase-messaging-compat.js"
);
// Initialize the Firebase app in the service worker by passing in
// your app's Firebase config object.
// https://firebase.google.com/docs/web/setup#config-object
firebase.initializeApp({
  apiKey: "AIzaSyB1M33hbyUeD7Xe6_D26JEPD4y4WV2nkm4",
  authDomain: "kakowen-aw.firebaseapp.com",
  databaseURL:
    "https://kakowen-aw-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "kakowen-aw",
  storageBucket: "kakowen-aw.appspot.com",
  messagingSenderId: "426780904890",
  appId: "1:426780904890:web:57f674c554f424440a6183",
  measurementId: "G-W2WRSTM5BJ",
});
// Retrieve an instance of Firebase Messaging so that it can handle background
// messages.
const messaging = firebase.messaging();
