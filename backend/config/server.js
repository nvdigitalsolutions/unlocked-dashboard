module.exports = ({ env }) => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  app: {
    // Provide default keys in development to avoid missing APP_KEYS errors
    keys: env.array('APP_KEYS', [
      'default_key_1',
      'default_key_2',
    ]),
  },
});
