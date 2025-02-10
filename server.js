const express = require("express");
const Corrosion = require("corrosion");
const cors = require("cors");
const helmet = require("helmet");

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = "0.0.0.0"; // Allows external access in Codespaces

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());

// Initialize Corrosion Proxy
const proxy = new Corrosion({
    prefix: "/proxy/",
    codec: "base64", // More stable encoding
    title: "My Proxy",
    requestMiddleware: [],
    responseMiddleware: []
});

// Middleware to properly handle requests
app.use("/proxy/", (req, res) => proxy.request(req, res));

// Homepage with URL input
app.get("/", (req, res) => {
    res.send(`
        <h2>Enter a URL to Browse</h2>
        <form action="/proxy/" method="get">
            <input type="text" name="url" placeholder="https://example.com" required>
            <button type="submit">Go</button>
        </form>
    `);
});

// Start server
app.listen(PORT, HOST, () => {
    console.log(`Proxy running at http://localhost:${PORT}`);
});
