module.exports = {
  apps: [
    {
      name: "Wace",
      script: "dist/index.js",
      env_production: {
        NODE_ENV: "production",
      },
      env_development: {
        NODE_ENV: "development",
      },
    },
  ],
};
