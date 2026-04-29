module.exports = {
  apps: [
    {
      name: 'feedbackforms-api',
      script: 'dist/main.js',
      cwd: 'C:\\feedbackforms\\backend',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      env: {
        NODE_ENV: 'production',
      },
    },
  ],
};
