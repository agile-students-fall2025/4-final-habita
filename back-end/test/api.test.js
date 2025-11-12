// back-end/test/api.test.js
const request = require("supertest")
const { expect } = require("chai")
const app = require("../app")

describe("API Routes", () => {
  it("should return ok for health", async () => {
    const res = await request(app).get("/api/health")
    expect(res.status).to.equal(200)
    expect(res.body.status).to.equal("ok")
  })

  it("should get all bills", async () => {
    const res = await request(app).get("/api/bills")
    expect(res.status).to.equal(200)
    // server returns { data: [...] }
    expect(res.body).to.have.property("data").that.is.an("array")
  })

  it("should toggle a task", async () => {
    const res = await request(app).patch("/api/tasks/t1/complete")
    expect(res.status).to.equal(200)
    expect(res.body).to.have.property("completed")
  })
})
