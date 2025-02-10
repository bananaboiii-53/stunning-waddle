const { execSync } = require("child_process");
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const WebSocket = require("ws");
const cors = require("cors");
const helmet = require("helmet");
const url = require("url");

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
const app = express();
const PORT = 3000;

// Security headers
app.use(helmet({
    contentSecurityPolicy: false
}));

// CORS for cross-origin requests
app.use(cors());

// Serve a homepage for users to enter a URL
app.get("/", (req, res) => {
    res.send(`
        <h2>Enter a URL to Browse</h2>
        <form action="/proxy/" method="get">
            <input type="text" name="url" placeholder="https://example.com" required>
            <button type="submit">Go</button>
        </form>
    `);
});

// Dynamic proxy for any URL
app.use("/proxy/", (req, res, next) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send("Missing 'url' parameter.");
    }

    // Parse the target URL
    const parsedUrl = url.parse(targetUrl);
    const target = `${parsedUrl.protocol}//${parsedUrl.host}`;

    console.log(`Proxying request to: ${target}`);

    return createProxyMiddleware({
        target: target,
        changeOrigin: true,
        selfHandleResponse: false,
        onProxyReq: (proxyReq, req) => {
            let newUrl = req.originalUrl.replace("/proxy/?url=", "");
            proxyReq.path = newUrl;
        }
    })(req, res, next);
});

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
