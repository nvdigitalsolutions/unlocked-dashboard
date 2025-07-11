module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET'),
  },
  apiToken: {
    salt: env('API_TOKEN_SALT'),
  },
  preview: {
    clientUrl: env('CLIENT_URL', 'http://localhost:3000'),
    previewSecret: env('PREVIEW_SECRET', 'supersecret'),
  },
  transfer: {
    token: {
      salt: env('TRANSFER_TOKEN_SALT'),
    },
  },
});
