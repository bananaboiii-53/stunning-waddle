const { execSync } = require("child_process");
const fs = require("fs");

// Required dependencies
const dependencies = ["express", "http-proxy-middleware", "ws", "cors", "helmet"];

// Function to install missing dependencies
const installDependencies = () => {
    console.log("Checking dependencies...");
    let missing = dependencies.filter(dep => {
        try {
            require.resolve(dep);
            return false;
        } catch (e) {
            return true;
        }
    });

    if (missing.length > 0) {
        console.log(`Installing missing dependencies: ${missing.join(", ")}`);
        execSync(`npm install ${missing.join(" ")}`, { stdio: "inherit" });
    } else {
        console.log("All dependencies are installed.");
    }
};

// Install dependencies if needed
installDependencies();

// Import installed packages
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const WebSocket = require("ws");
const cors = require("cors");
const helmet = require("helmet");

const app = express();
const PORT = 3000;

// Security headers
app.use(helmet({
    contentSecurityPolicy: false
}));

// CORS for cross-origin requests
app.use(cors());

// Serve a simple homepage for users to enter a URL
app.get("/", (req, res) => {
    res.send(`
        <h2>Enter a URL to Browse</h2>
        <form action="/proxy/" method="get">
            <input type="text" name="url" placeholder="https://example.com" required>
            <button type="submit">Go</button>
        </form>
    `);
});

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
