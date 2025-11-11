const { expect } = require("chai")
const EventEmitter = require("events")
const httpMocks = require("node-mocks-http")
const app = require("../app")
const { chatStore } = require("../services/chatStore")

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

describe("Chat API", () => {
  beforeEach(() => {
    chatStore.reset()
  })

  it("lists seeded threads with summaries", async () => {
    const res = await dispatch({
      method: "GET",
      url: "/api/chat/threads",
    })
    expect(res.statusCode).to.equal(200)
    const body = res._getJSONData()
    expect(body.data).to.be.an("array").that.is.not.empty
    expect(body.data[0]).to.include.keys(
      "id",
      "name",
      "contextType",
      "participants",
      "messageCount"
    )
  })

  it("returns messages for an existing thread", async () => {
    const res = await dispatch({
      method: "GET",
      url: "/api/chat/messages",
      query: { threadId: "house" },
    })
    expect(res.statusCode).to.equal(200)
    const body = res._getJSONData()
    expect(body.data).to.be.an("array")
    expect(body.data[0]).to.include.keys("id", "text", "sender")
  })

  it("creates a message for a new task thread on demand", async () => {
    const payload = {
      contextType: "task",
      contextId: "999",
      sender: "You",
      text: "Heads up, starting this task now.",
      participants: ["You", "Alex"],
      name: "Demo Task",
    }
    const res = await dispatch({
      method: "POST",
      url: "/api/chat/messages",
      headers: { "content-type": "application/json" },
      body: payload,
    })
    expect(res.statusCode).to.equal(201)
    const body = res._getJSONData()
    expect(body.data.thread.id).to.equal("task-999")
    expect(body.data.message.text).to.equal(payload.text)

    const fetchMessages = await dispatch({
      method: "GET",
      url: "/api/chat/messages",
      query: { contextType: "task", contextId: "999" },
    })
    expect(fetchMessages.statusCode).to.equal(200)
    const msgBody = fetchMessages._getJSONData()
    expect(msgBody.data).to.have.lengthOf(1)
  })

  it("marks a thread as read", async () => {
    const res = await dispatch({
      method: "PATCH",
      url: "/api/chat/threads/house/read",
    })
    expect(res.statusCode).to.equal(200)
    const body = res._getJSONData()
    expect(body.data.id).to.equal("house")
    expect(body.data.unreadCount).to.equal(0)
  })
})
