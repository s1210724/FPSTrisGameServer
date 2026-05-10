const jwt = require('jsonwebtoken');

const {
    createRemoteJWKSet,
    jwtVerify,
} = require('jose');

console.log(`${process.env.API_SERVER_URL}/api/.well-known/jwks.json`);
const JWKS = createRemoteJWKSet(
    new URL(`${process.env.API_SERVER_URL}/api/.well-known/jwks.json`)
);

async function verifyToken(token) {
    const { payload } = await jwtVerify(token, JWKS, {
        issuer: process.env.JWT_ISSUER,
        audience: process.env.JWT_AUDIENCE,
    });

    return payload;
}

module.exports = {
    verifyToken,
};