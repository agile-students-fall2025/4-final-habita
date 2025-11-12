// back-end/test/api.test.js
import request from "supertest";
import { expect } from "chai";
import app from "../app.js";

describe("API Routes", () => {
  it("should return ok for health", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).to.equal(200);
    expect(res.body.status).to.equal("ok");
  });

  it("should get all bills", async () => {
    const res = await request(app).get("/api/bills");
    expect(res.status).to.equal(200);
    expect(res.body).to.be.an("array");
  });

  it("should toggle a task", async () => {
    const res = await request(app).patch("/api/tasks/t1/complete");
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("completed");
  });
});
