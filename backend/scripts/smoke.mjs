import assert from 'node:assert/strict';

const base = process.env.API_URL ?? 'http://localhost:3000';
async function api(path, token, method = 'GET', body, status = 200) {
  const response = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  const data = await response.json();
  assert.equal(
    response.status,
    status,
    `${method} ${path}: ${JSON.stringify(data)}`,
  );
  return data;
}
const tokens = {};
const actors = {};
for (const role of ['admin', 'manager', 'user']) {
  const result = await api(
    '/auth/login',
    null,
    'POST',
    {
      email: `${role}@ticketflow.test`,
      password: process.env.SEED_PASSWORD ?? 'password123',
    },
    201,
  );
  tokens[role] = result.accessToken;
  actors[role] = result.user;
  assert.equal(result.user.passwordHash, undefined);
}
const ids = [];
try {
  const ticket = await api(
    '/tickets',
    tokens.user,
    'POST',
    {
      title: `Smoke ${Date.now()}`,
      description: 'Temporary API smoke test ticket',
      priority: 'HIGH',
    },
    201,
  );
  ids.push(ticket.id);
  const foreign = await api(
    '/tickets',
    tokens.admin,
    'POST',
    {
      title: `Private ${Date.now()}`,
      description: 'Temporary admin-owned test ticket',
    },
    201,
  );
  ids.push(foreign.id);
  await api(`/tickets/${foreign.id}`, tokens.user, 'GET', undefined, 404);
  await api(
    `/tickets/${foreign.id}/comments`,
    tokens.user,
    'POST',
    { content: 'Denied' },
    404,
  );
  await api(`/tickets/${ticket.id}`, tokens.user, 'PATCH', {
    title: ticket.title + ' updated',
  });
  await api(
    `/tickets/${ticket.id}`,
    tokens.user,
    'PATCH',
    { status: 'CLOSED' },
    403,
  );
  await api(`/tickets/${ticket.id}`, tokens.manager, 'PATCH', {
    assignedToId: actors.manager.id,
    status: 'IN_PROGRESS',
  });
  await api(
    `/tickets/${ticket.id}`,
    tokens.user,
    'PATCH',
    { title: 'Cannot edit now' },
    400,
  );
  await api(
    `/tickets/${ticket.id}/comments`,
    tokens.user,
    'POST',
    { content: 'Smoke test comment' },
    201,
  );
  const comments = await api(
    `/tickets/${ticket.id}/comments?page=1&perPage=1`,
    tokens.manager,
  );
  assert.equal(comments.meta.total, 1);
  assert.equal(comments.items[0].author.id, actors.user.id);
  const list = await api(
    `/tickets?search=${encodeURIComponent(ticket.title)}&status=IN_PROGRESS&priority=HIGH&page=1&perPage=1`,
    tokens.user,
  );
  assert.equal(list.meta.total, 1);
  assert.equal(list.items[0].id, ticket.id);
  const stats = await api('/dashboard/statistics', tokens.user);
  assert.ok(stats.byStatus.IN_PROGRESS >= 1);
  assert.equal(
    stats.total,
    Object.values(stats.byStatus).reduce((sum, count) => sum + count, 0),
  );
  await api(`/tickets/${ticket.id}`, tokens.manager, 'DELETE', undefined, 403);
  await api(`/tickets/${ticket.id}`, tokens.admin, 'PATCH', {
    assignedToId: null,
  });
  const docs = await api('/docs-json');
  assert.ok(docs.paths['/tickets/{id}/comments']);
  assert.ok(docs.components.schemas.CreateTicketDto.properties.title);
  console.log(
    'Live API smoke passed: JWT, RBAC, CRUD, assignment, comments, filters, pagination, statistics, Swagger.',
  );
} finally {
  for (const id of ids) await api(`/tickets/${id}`, tokens.admin, 'DELETE');
}
