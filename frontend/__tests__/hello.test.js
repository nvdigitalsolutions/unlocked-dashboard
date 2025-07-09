import handler from '../pages/api/hello';
import { createMocks } from 'node-mocks-http';

test('hello api returns greeting', async () => {
  const { req, res } = createMocks({ method: 'GET' });
  await handler(req, res);
  expect(res._getStatusCode()).toBe(200);
  expect(JSON.parse(res._getData())).toEqual({ message: 'hello' });
});
