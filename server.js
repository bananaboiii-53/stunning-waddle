const { execSync } = require("child_process");
const express = require("express");
const Corrosion = require("corrosion");
const cors = require("cors");
const helmet = require("helmet");

// Automatically install missing dependencies
const dependencies = ["express", "corrosion", "cors", "helmet"];
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

// Initialize Corrosion Proxy
const proxy = new Corrosion({
    prefix: "/proxy/",
    codec: "xor",
    requestMiddleware: [],
    responseMiddleware: []
});

// Proxy middleware
app.use("/proxy/", (req, res) => proxy.request(req, res));

// Serve homepage
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
