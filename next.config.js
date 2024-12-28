require('dotenv').config()

const nextConfig = {
	trailingSlash: true,
	reactStrictMode: true
}

module.exports = {
  assetPrefix: "./",
  output: 'export',  // Enables static HTML export
  images: {
    unoptimized: true // Required for static export
  }
}
