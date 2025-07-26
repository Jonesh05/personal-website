"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helloWorld = void 0;
const firebase_functions_1 = require("firebase-functions");
exports.helloWorld = firebase_functions_1.https.onRequest((req, res) => {
    res.send("Hello from Firebase Functions!");
});
//# sourceMappingURL=index.js.map