import { expect } from 'chai';
import request from 'supertest';
import { createApp } from '../src/server.js';

describe('POST /api/groups', () => {
  const app = createApp();

  it('creates a group with minimal valid payload', async () => {
    const res = await request(app)
      .post('/api/groups')
      .send({ name: 'Room 4A' })
      .expect(201);

    expect(res.body).to.have.property('group');
    expect(res.body.group).to.include({ name: 'Room 4A' });
    expect(res.body.group).to.have.property('id');
    expect(res.body.group.members).to.be.an('array');
  });

  it('validates missing name', async () => {
    const res = await request(app)
      .post('/api/groups')
      .send({})
      .expect(400);

    expect(res.body).to.have.property('error');
  });

  it('validates members format', async () => {
    await request(app)
      .post('/api/groups')
      .send({ name: 'Group', members: [123] })
      .expect(400);
  });
});




