module.exports = {
  apps: [
    {
      name: 'feedbackforms-api',
      script: 'dist/main.js',
      cwd: 'C:\\feedbackforms\\backend',
      instances: 2,
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
