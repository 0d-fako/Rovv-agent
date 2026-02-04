const fs = require('fs');
const https = require('https');
const path = require('path');

try {
    const envPath = path.resolve(__dirname, '.env.local');
    if (!fs.existsSync(envPath)) {
        console.error("Error: .env.local file not found.");
        process.exit(1);
    }
    const env = fs.readFileSync(envPath, 'utf8');
    const match = env.match(/GEMINI_API_KEY=(.*)/);

    if (!match || !match[1]) {
        console.error("Error: GEMINI_API_KEY not found in .env.local");
        process.exit(1);
    }

    const key = match[1].trim();
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;

    console.log(`Fetching models...`);

    https.get(url, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
            try {
                const response = JSON.parse(data);
                if (response.error) {
                    console.error("API Error:", JSON.stringify(response.error, null, 2));
                } else if (response.models) {
                    console.log("Available Models:");
                    response.models.forEach(m => console.log(`- ${m.name.replace('models/', '')} (${m.displayName})`));
                } else {
                    console.log("Unexpected response format:", data);
                }
            } catch (err) {
                console.error("Failed to parse response:", err);
                console.log("Raw response:", data);
            }
        });
    }).on('error', (e) => {
        console.error("Request failed:", e);
    });

} catch (err) {
    console.error("Script error:", err);
}
