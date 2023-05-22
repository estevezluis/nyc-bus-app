/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        API_ENDPOINT: process.env.API_ENDPOINT,
        API_KEY: process.env.API_KEY,
        MAPBOX_ACCESS_TOKEN: process.env.MAPBOX_ACCESS_TOKEN,
    }
}

module.exports = nextConfig
