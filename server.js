const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const helmet = require("helmet");
const url = require("url");

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0"; // Allows external access in Codespaces

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());

// Proxy middleware to handle dynamic URL loading
app.use("/proxy", (req, res, next) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send("Missing 'url' parameter.");
    }

    // Ensure the URL provided starts with http:// or https://
    const parsedUrl = url.parse(targetUrl);
    if (!parsedUrl.protocol) {
        return res.status(400).send("Invalid URL.");
    }

    const proxyOptions = {
        target: targetUrl,
        changeOrigin: true,
        selfHandleResponse: false,
        onProxyReq: (proxyReq, req) => {
            // Set necessary headers for Google or other sites
            proxyReq.setHeader("Referer", targetUrl);
            proxyReq.setHeader("Origin", targetUrl);
        },
        onProxyRes: (proxyRes, req, res) => {
            // Rewrite the URLs in the page to keep them within the proxy
            const location = proxyRes.headers["location"];
            if (location) {
                proxyRes.headers["location"] = location.replace(
                    /^https?:\/\//,
                    req.protocol + "://" + req.get("host") + "/proxy"
                );
            }
        }
    };

    createProxyMiddleware(proxyOptions)(req, res, next);
});

// Serve homepage with URL input
app.get("/", (req, res) => {
    res.send(`
        <h2>Enter a URL to Browse</h2>
        <form action="/proxy" method="get">
            <input type="text" name="url" placeholder="https://google.com" required>
            <button type="submit">Go</button>
        </form>
    `);
});

// Start server
app.listen(PORT, HOST, () => {
    console.log(`Proxy running at http://localhost:${PORT}`);
});
