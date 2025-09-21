module.exports = {
  apps: [{
    name: 'inspiration-oasis-backend',
    script: './dist/index.js',
    instances: 1,
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3002
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: process.env.PORT || 3002
    }
  }]
};