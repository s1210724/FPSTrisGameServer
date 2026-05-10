const http = require("http");
const https = require("https");
const { URL } = require("url");

function proxyJsonRequest(targetUrl, payload) {
    return new Promise((resolve, reject) => {
        const parsedUrl = new URL(targetUrl);
        const requestBody = JSON.stringify(payload);
        const requestClient = parsedUrl.protocol === "https:" ? https : http;

        const request = requestClient.request({
            hostname: parsedUrl.hostname,
            port: parsedUrl.port,
            path: `${parsedUrl.pathname}${parsedUrl.search}`,
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Content-Length": Buffer.byteLength(requestBody),
            },
        }, (response) => {
            let responseBody = "";

            response.setEncoding("utf8");
            response.on("data", (chunk) => {
                responseBody += chunk;
            });

            response.on("end", () => {
                resolve({
                    statusCode: response.statusCode,
                    body: responseBody,
                });
            });
        });

        request.on("error", reject);
        request.write(requestBody);
        request.end();
    });
}

function setAuthCookie(res, token) {
    const cookieParts = [
        `token=${encodeURIComponent(token)}`,
        "HttpOnly",
        "Path=/",
        "SameSite=Lax",
    ];

    if (process.env.NODE_ENV === "production") {
        cookieParts.push("Secure");
    }

    res.setHeader("Set-Cookie", cookieParts.join("; "));
}

exports.postLogin = async (req, res) => {
    try {
        const apiServerUrl = `${process.env.API_SERVER_URL}/api/auth/login`;
        const proxyResponse = await proxyJsonRequest(apiServerUrl, req.body);

        let responseData = {};
        if (proxyResponse.body) {
            try {
                responseData = JSON.parse(proxyResponse.body);
            } catch (error) {
                responseData = { message: proxyResponse.body };
            }
        }

        if (proxyResponse.statusCode < 200 || proxyResponse.statusCode >= 300) {
            return res.status(proxyResponse.statusCode).json(responseData);
        }

        if (!responseData.token) {
            return res.status(502).json({
                message: "Login succeeded but no token was returned by the API server.",
            });
        }

        setAuthCookie(res, responseData.token);

        return res.json({
            message: "Login successful",
        });
    } catch (error) {
        console.error("Login proxy failed:", error);
        return res.status(500).json({
            message: "Unable to complete login.",
        });
    }
};
