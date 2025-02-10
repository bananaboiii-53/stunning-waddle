const { execSync } = require("child_process");
const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");
const helmet = require("helmet");

// Automatically install missing dependencies
const dependencies = ["express", "http-proxy-middleware", "cors", "helmet"];
const installDependencies = () => {
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
    }
};
installDependencies();

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0"; // Allows external access in Codespaces

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());

// Serve homepage
app.get("/", (req, res) => {
    res.send(`
        <h2>Enter a URL to Browse</h2>
        <form action="/proxy" method="get">
            <input type="text" name="url" placeholder="https://example.com" required>
            <button type="submit">Go</button>
        </form>
    `);
});

// Proxy Middleware
app.use("/proxy", (req, res, next) => {
    const targetUrl = req.query.url;
    if (!targetUrl) {
        return res.status(400).send("Missing 'url' parameter.");
    }

    return createProxyMiddleware({
        target: targetUrl,
        changeOrigin: true,
        selfHandleResponse: false,
        onProxyReq: (proxyReq, req) => {
            proxyReq.setHeader("Referer", targetUrl);
            proxyReq.setHeader("Origin", targetUrl);
        }
    })(req, res, next);
});

// Start server
app.listen(PORT, HOST, () => {
    console.log(`Proxy running at http://localhost:${PORT}`);
});
