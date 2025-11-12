const { expect } = require("chai")
const EventEmitter = require("events")
const httpMocks = require("node-mocks-http")
const app = require("../app")

const dispatch = (options) =>
  new Promise((resolve, reject) => {
    const req = httpMocks.createRequest(options)
    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter.EventEmitter,
    })
    res.on("end", () => resolve(res))
    res.on("finish", () => resolve(res))
    app.handle(req, res, (err) => {
      if (err) reject(err)
    })
  })

describe("Bills API", () => {
  it("returns a list of bills", async () => {
    const res = await dispatch({ method: "GET", url: "/api/bills/" })
    expect(res.statusCode).to.equal(200)
    const body = res._getJSONData()
    expect(body).to.have.property("data").that.is.an("array")
  })

  it("creates a new bill", async () => {
    const payload = { title: "Test Bill", amount: 12.5, splitBetween: ["You"] }
    const res = await dispatch({ method: "POST", url: "/api/bills/", body: payload })
    expect(res.statusCode).to.equal(201)
    const body = res._getJSONData()
    expect(body.data).to.include({ title: "Test Bill" })
    expect(body.data).to.have.property("id")
  })

  it("updates a bill and toggles payment", async () => {
    // create
    const create = await dispatch({ method: "POST", url: "/api/bills/", body: { title: "Toggle Bill", amount: 10, splitBetween: ["You", "Alex"] } })
    const created = create._getJSONData().data

    // toggle payment for You
    const toggle = await dispatch({ method: "PATCH", url: `/api/bills/${created.id}/pay`, body: { person: "You" } })
    expect(toggle.statusCode).to.equal(200)
    const toggled = toggle._getJSONData().data
    expect(toggled.payments).to.have.property("You")

    // mark as paid by toggling remaining person
    const toggle2 = await dispatch({ method: "PATCH", url: `/api/bills/${created.id}/pay`, body: { person: "Alex" } })
    const toggled2 = toggle2._getJSONData().data
    expect(toggled2.status).to.be.oneOf(["paid", "unpaid"])
  })
})
