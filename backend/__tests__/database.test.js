const getConfig = require('../config/database');

const envFn = (vars) => {
  const env = (key, def) => (key in vars ? vars[key] : def);
  env.int = (key, def) => (key in vars ? parseInt(vars[key], 10) : def);
  env.bool = (key, def) => (key in vars ? vars[key] === 'true' : def);
  env.array = (key, def) => (key in vars ? vars[key].split(',') : def);
  return env;
};

test('defaults to sqlite', () => {
  const config = getConfig({ env: envFn({}) });
  expect(config.connection.client).toBe('sqlite');
});

test('uses postgres when DATABASE_CLIENT=postgres', () => {
  const vars = {
    DATABASE_CLIENT: 'postgres',
    DATABASE_HOST: 'db',
    DATABASE_PORT: '5432',
    DATABASE_NAME: 'strapi',
    DATABASE_USERNAME: 'strapi',
    DATABASE_PASSWORD: 'strapi',
  };
  const config = getConfig({ env: envFn(vars) });
  expect(config.connection.client).toBe('postgres');
  expect(config.connection.connection.host).toBe('db');
});
