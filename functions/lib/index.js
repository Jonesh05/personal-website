"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.helloWorld = void 0;
const https_1 = require("firebase-functions/v2/https");
exports.helloWorld = (0, https_1.onRequest)((req, res) => {
    res.send('Hello from Firebase Functions!');
});
//# sourceMappingURL=index.js.map