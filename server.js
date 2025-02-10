const { execSync } = require("child_process");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const path = require("path");

// Install dependencies automatically if missing
const dependencies = ["express", "cors", "helmet"];
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
const HOST = "0.0.0.0"; // Allows GitHub Codespaces access

app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors());

// Serve a homepage
app.get("/", (req, res) => {
    res.send(`
        <h2>Enter a URL to Browse</h2>
        <form action="/proxy/" method="get">
            <input type="text" name="url" placeholder="https://example.com" required>
            <button type="submit">Go</button>
        </form>
    `);
});

// 🌐 Integrate Ultraviolet Proxy
const ultraviolet = require("ultraviolet-node");
app.use("/proxy/", ultraviolet.middleware());

// Start server
app.listen(PORT, HOST, () => {
    console.log(`Proxy running at http://localhost:${PORT}`);
});
