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
            let location = proxyRes.headers["location"];
            if (location) {
                // Keep redirects inside the proxy (e.g., https://yourdomain.com/proxy/google.com)
                proxyRes.headers["location"] = location.replace(
                    /^https?:\/\//,
                    req.protocol + "://" + req.get("host") + "/proxy"
                );
            }

            // Modify the response body to rewrite URLs (links, images, form actions)
            let chunks = [];
            proxyRes.on("data", chunk => {
                chunks.push(chunk);
            });

            proxyRes.on("end", () => {
                const body = Buffer.concat(chunks).toString();
                const modifiedBody = body
                    .replace(/https?:\/\/([a-zA-Z0-9.-]+)(\/[^\s]*)?/g, (match, p1, p2) => {
                        return req.protocol + "://" + req.get("host") + "/proxy?url=" + match;
                    })
                    .replace(/action="\/(.*?\/google\.com)/g, 'action="/proxy?url=https://$1"');

                res.setHeader("Content-Type", proxyRes.headers["content-type"]);
                res.end(modifiedBody);
            });
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
