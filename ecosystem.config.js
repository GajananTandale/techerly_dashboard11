const config = require("dotenv").config().parsed;

module.exports = {
  apps: [
    {
      name: "debe",
      script: "yarn start",
      args: "",
      instances: 1,
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: "production"
      },
      env_production: {
        ...config,
        NODE_ENV: "production"
      },
    }
  ],
  deploy: {
    production: {
      key: config.DEPLOYMENT_KEY,
      user: config.DEPLOYMENT_USER,
      host: [config.DEPLOYMENT_HOST],
      ref: "origin/main",
      repo: "git@github.com:IITB-EdTech/tcherly.git",
      path: "~/debe",
      "forward-agent": true,
      "post-deploy": "yarn && yarn install:c && yarn build && pm2 startOrRestart ecosystem.config.js --env production --update-env"
    }
  }
};
