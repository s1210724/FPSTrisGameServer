const { verifyToken } = require('../auth/jwtValidator');

function getCookieValue(cookieHeader, cookieName) {
    if (!cookieHeader) {
        return null;
    }

    const cookies = cookieHeader.split(";").map((entry) => entry.trim());
    const match = cookies.find((entry) => entry.startsWith(`${cookieName}=`));
    if (!match) {
        return null;
    }

    return decodeURIComponent(match.slice(cookieName.length + 1));
}

async function pageAuthMiddleware(req, res, next) {
    try {
        const token = getCookieValue(req.headers.cookie, "token");

        if (!token) {
            return res.status(401).redirect("/login");
        }

        const payload = await verifyToken(token);
        req.user = payload;
        next();
    } catch (error) {
        console.error("Page auth verification failed:", error);
        return res.status(401).redirect("/login");
    }
}

async function pageAdminMiddleware(req, res, next) {
    try {
        const token = getCookieValue(req.headers.cookie, "token");

        if (!token) {
            return res.status(401).redirect("/login");
        }

        const payload = await verifyToken(token);

        if (!Array.isArray(payload.claims) || !payload.claims.includes("admin")) {
            return res.status(403).sendFile(
                require("../services/pageService").getViewPath("forbidden.html")
            );
        }

        req.user = payload;
        next();
    } catch (error) {
        console.error("Page admin verification failed:", error);
        return res.status(401).redirect("/login");
    }
}

async function pageGuestMiddleware(req, res, next) {
    try {
        const token = getCookieValue(req.headers.cookie, "token");

        if (!token) {
            // No token, proceed to show guest page (login/register)
            return next();
        }

        const payload = await verifyToken(token);
        // User is already authenticated, redirect to home
        return res.redirect("/");
    } catch (error) {
        // Invalid/expired token, proceed to show guest page
        return next();
    }
}

module.exports = {
    getCookieValue,
    pageAuthMiddleware,
    pageAdminMiddleware,
    pageGuestMiddleware,
};
