const { expect } = require("chai")
const EventEmitter = require("events")
const httpMocks = require("node-mocks-http")
const app = require("../app")
const { homeStore } = require("../services/homeStore")

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

describe("Home summary API", () => {
  it("returns personalized stats for default user", async () => {
    const res = await dispatch({
      method: "GET",
      url: "/api/home/summary",
    })
    expect(res.statusCode).to.equal(200)
    const body = res._getJSONData()
    expect(body.data.user).to.equal("You")
    expect(body.data.tasks.stats).to.include.keys("dueToday", "overdue", "pending")
    expect(body.data.bills.stats).to.include.keys("unpaid", "paid", "dueSoon")
  })

  it("responds with deterministic events map", async () => {
    const summary = homeStore.getSummary("You")
    expect(summary.eventsByISO).to.be.an("object")
    const firstDate = Object.keys(summary.eventsByISO)[0]
    expect(summary.eventsByISO[firstDate][0]).to.include.keys("type", "title")
  })
})
