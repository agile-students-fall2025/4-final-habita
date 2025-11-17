// back-end/test/api.test.js
const { expect } = require("chai")
const EventEmitter = require("events")
const httpMocks = require("node-mocks-http")
const app = require("../app")

const dispatch = (options) =>
  new Promise((resolve, reject) => {
    const req = httpMocks.createRequest(options)
    const res = httpMocks.createResponse({ eventEmitter: EventEmitter.EventEmitter })
    res.on("end", () => resolve(res))
    res.on("finish", () => resolve(res))
    app.handle(req, res, (err) => {
      if (err) reject(err)
    })
  })

describe("API Routes", () => {
  it("should return ok for health", async () => {
    const res = await dispatch({ method: "GET", url: "/api/health" })
    expect(res.statusCode).to.equal(200)
    const body = res._getJSONData()
    expect(body.status).to.equal("ok")
  })

  it("should get all bills", async () => {
    const res = await dispatch({ method: "GET", url: "/api/bills" })
    expect(res.statusCode).to.equal(200)
    // server returns { data: [...] }
    const body = res._getJSONData()
    expect(body).to.have.property("data").that.is.an("array")
  })

  it("should toggle a task", async () => {
    const res = await dispatch({ method: "PATCH", url: "/api/tasks/t1/complete" })
    expect(res.statusCode).to.equal(200)
    const body = res._getJSONData()
    expect(body).to.have.property("completed")
  })
})
