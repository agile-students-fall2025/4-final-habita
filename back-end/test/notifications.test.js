const { expect } = require("chai")
const EventEmitter = require("events")
const httpMocks = require("node-mocks-http")
const app = require("../app")
const { notificationStore } = require("../services/notificationStore")

describe("Notifications API", () => {
  beforeEach(() => {
    notificationStore.reset()
  })

  it("returns Discord-style notifications with meta counts", async () => {
    const res = await dispatch({
      method: "GET",
      url: "/api/notifications",
    })

    const body = res._getJSONData()
    expect(res.statusCode).to.equal(200)
    expect(body.data).to.have.length.greaterThan(0)
    expect(body.meta.total).to.equal(body.data.length)
    expect(body.data[0]).to.include.all.keys(
      "id",
      "channelId",
      "title",
      "body",
      "createdAt"
    )
  })

  it("filters unread mentions for the current user", async () => {
    const res = await dispatch({
      method: "GET",
      url: "/api/notifications",
      query: { unread: "true", mentions: "You" },
    })

    const body = res._getJSONData()
    expect(res.statusCode).to.equal(200)
    expect(body.data.every((item) => !item.readAt)).to.equal(true)
    expect(body.data.every((item) => item.mentions.includes("You"))).to.equal(true)
  })

  it("creates a new notification and echoes it back", async () => {
    const payload = {
      title: "New roommate poll",
      body: "Vote on living room layout.",
      channelId: "house-chat",
      mentions: ["You", "Sam"],
      priority: "low",
    }

    const res = await dispatch({
      method: "POST",
      url: "/api/notifications",
      headers: { "content-type": "application/json" },
      body: payload,
    })

    const body = res._getJSONData()
    expect(res.statusCode).to.equal(201)
    expect(body.data.title).to.equal(payload.title)

    const filtered = await dispatch({
      method: "GET",
      url: "/api/notifications",
      query: { search: "living room" },
    })

    const searchBody = filtered._getJSONData()
    expect(searchBody.data[0].title).to.equal(payload.title)
  })

  it("marks a notification as read", async () => {
    const target = notificationStore.list({ unread: true })[0]
    const res = await dispatch({
      method: "PATCH",
      url: `/api/notifications/${target.id}/read`,
      headers: { "content-type": "application/json" },
      body: { read: true },
    })

    const body = res._getJSONData()
    expect(res.statusCode).to.equal(200)
    expect(body.data.readAt).to.be.a("string")
  })

  it("returns a Discord-style summary with channel aggregates", async () => {
    const res = await dispatch({
      method: "GET",
      url: "/api/notifications/summary",
    })

    const body = res._getJSONData()
    expect(res.statusCode).to.equal(200)
    expect(body).to.include.keys("total", "unread", "channels", "highlights")
    expect(body.channels).to.be.an("array").that.is.not.empty
    expect(body.highlights).to.have.length.at.most(3)
  })
})

function dispatch({ method, url, query, headers = {}, body }) {
  return new Promise((resolve, reject) => {
    const req = httpMocks.createRequest({
      method,
      url,
      query,
      headers,
      body,
    })

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter.EventEmitter,
    })

    res.on("end", () => resolve(res))
    res.on("finish", () => resolve(res))

    app.handle(req, res, (err) => {
      if (err) {
        reject(err)
      }
    })
  })
}
