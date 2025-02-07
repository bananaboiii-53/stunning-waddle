const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const WebSocket = require("ws");
const cors = require("cors");
const helmet = require("helmet");

const app = express();
const PORT = 3000;

// Security headers
app.use(helmet({
    contentSecurityPolicy: false // Allow proxying of external scripts
}));

// CORS to allow cross-origin requests
app.use(cors());

// Function to modify Google search forms
const modifyGoogleSearch = (html, proxyUrl) => {
    return html.replace(/action="\/search"/g, `action="${proxyUrl}/search"`);
};

// Proxy middleware for all HTTP requests
app.use("/proxy/", createProxyMiddleware({
    target: "https://www.google.com",
    changeOrigin: true,
    selfHandleResponse: true,
    onProxyRes: async (proxyRes, req, res) => {
        let body = "";
        proxyRes.on("data", chunk => { body += chunk; });
        proxyRes.on("end", () => {
            if (proxyRes.headers["content-type"] && proxyRes.headers["content-type"].includes("text/html")) {
                body = modifyGoogleSearch(body, "/proxy");
            }
            res.writeHead(proxyRes.statusCode, proxyRes.headers);
            res.end(body);
        });
    }
}));

// WebSocket proxy to handle dynamic content
const wss = new WebSocket.Server({ noServer: true });

app.server = app.listen(PORT, () => {
    console.log(`Proxy running at http://localhost:${PORT}`);
});

// Upgrade server to support WebSockets
app.server.on("upgrade", (req, socket, head) => {
    wss.handleUpgrade(req, socket, head, (ws) => {
        ws.on("message", (msg) => {
            ws.send(`Received: ${msg}`);
        });
    });
});

console.log(`WebSocket Proxy Ready on Port ${PORT}`);
