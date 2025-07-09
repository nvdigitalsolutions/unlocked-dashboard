import handler from '../pages/api/login';
import { createMocks } from 'node-mocks-http';

test('rejects non POST requests', async () => {
  const { req, res } = createMocks({ method: 'GET' });
  await handler(req, res);
  expect(res._getStatusCode()).toBe(405);
});
