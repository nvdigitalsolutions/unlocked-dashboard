import handler from '../pages/api/preview';
import { createMocks } from 'node-mocks-http';

test('rejects invalid secret', async () => {
  const { req, res } = createMocks({ method: 'GET', query: { secret: 'bad', slug: 'test' } });
  await handler(req, res);
  expect(res._getStatusCode()).toBe(401);
});
