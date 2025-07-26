import { https } from "firebase-functions";

// función HTTP
export const helloWorld = https.onRequest((req, res) => {
  res.send("Hello from Firebase Functions!");
});
