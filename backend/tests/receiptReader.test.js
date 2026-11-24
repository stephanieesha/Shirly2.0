const { test, afterEach } = require('node:test')
const assert = require('node:assert/strict')
const anthropicModule = require('@anthropic-ai/sdk')
const Anthropic = anthropicModule.default || anthropicModule
const { createReceiptReader, ReceiptReadError, RECEIPT_TOOL, DEFAULT_MODEL } = require('../utils/receiptReader')
const { files } = require('./helpers')

const originalEnv = { ...process.env }
const originalConsoleError = console.error
afterEach(() => {
  process.env = { ...originalEnv }
  console.error = originalConsoleError
})

const reading = { looks_like_receipt: true, items: [{ name: 'Milk', quantity: 1, price: 2 }] }
const toolAnswer = (input, extra = {}) => ({
  content: [{ type: 'tool_use', name: RECEIPT_TOOL.name, input }],
  stop_reason: 'tool_use',
  ...extra,
})

// A stand-in for the Claude client that records the request it was given.
const stubClient = (answer) => {
  const requests = []
  return {
    requests,
    messages: {
      create: async (request) => {
        requests.push(request)
        if (answer instanceof Error) throw answer
        return answer
      },
    },
  }
}

// An error of the kinds the SDK throws, without needing a real HTTP response.
const apiError = (ErrorClass) => Object.assign(Object.create(ErrorClass.prototype), { message: 'details that must not reach the page' })

test('the photo is sent as an image, with the answer forced into the receipt shape', async () => {
  const client = stubClient(toolAnswer(reading))
  const result = await createReceiptReader({ client })(files.png, 'image/png')
  assert.deepEqual(result, reading)

  const request = client.requests[0]
  assert.equal(request.model, DEFAULT_MODEL)
  assert.deepEqual(request.tool_choice, { type: 'tool', name: 'record_receipt' })
  assert.deepEqual(request.tools, [RECEIPT_TOOL])
  const [image, text] = request.messages[0].content
  assert.equal(image.type, 'image')
  assert.equal(image.source.type, 'base64')
  assert.equal(image.source.media_type, 'image/png')
  assert.equal(image.source.data, files.png.toString('base64'))
  assert.match(text.text, /not instructions/)
})

test('the model can be chosen with a setting', async () => {
  process.env.ANTHROPIC_MODEL = 'claude-haiku-5-5'
  const client = stubClient(toolAnswer(reading))
  await createReceiptReader({ client })(files.jpeg, 'image/jpeg')
  assert.equal(client.requests[0].model, 'claude-haiku-5-5')
})

test('without an API key the reader says it is not set up, and makes no request', async () => {
  delete process.env.ANTHROPIC_API_KEY
  await assert.rejects(
    createReceiptReader()(files.jpeg, 'image/jpeg'),
    (error) => error instanceof ReceiptReadError && error.status === 503 && /isn't set up on this server/.test(error.message)
  )
})

const refusals = [
  ['no tool answer', { content: [{ type: 'text', text: 'Sorry' }], stop_reason: 'end_turn' }],
  ['no content', { stop_reason: 'end_turn' }],
  ['an answer that is not an object', { content: [{ type: 'tool_use', name: 'record_receipt', input: 'text' }] }],
  ['an empty answer', { content: [{ type: 'tool_use', name: 'record_receipt', input: null }] }],
  ['a different tool', { content: [{ type: 'tool_use', name: 'something_else', input: reading }] }],
  ['an answer that was cut off', toolAnswer(reading, { stop_reason: 'max_tokens' })],
]
for (const [label, answer] of refusals) {
  test(`${label} is reported, not used`, async () => {
    await assert.rejects(
      createReceiptReader({ client: stubClient(answer) })(files.jpeg, 'image/jpeg'),
      (error) => error instanceof ReceiptReadError && error.status === 502 && /clearer photo/.test(error.message)
    )
  })
}

const failures = [
  ['a timeout', Anthropic.APIConnectionTimeoutError, 504, /took too long/],
  ['rate limiting', Anthropic.RateLimitError, 503, /busy right now/],
  ['a rejected key', Anthropic.AuthenticationError, 503, /isn't set up correctly/],
  ['a missing permission', Anthropic.PermissionDeniedError, 503, /isn't set up correctly/],
  ['a photo the API refuses', Anthropic.BadRequestError, 422, /Try another one/],
  ['a server error', Anthropic.InternalServerError, 502, /Try again\.$/],
  ['a dropped connection', Anthropic.APIConnectionError, 502, /Try again\.$/],
]
for (const [label, ErrorClass, status, message] of failures) {
  test(`${label} becomes a plain message with no technical details`, async () => {
    console.error = () => {}
    const reader = createReceiptReader({ client: stubClient(apiError(ErrorClass)) })
    await assert.rejects(reader(files.jpeg, 'image/jpeg'), (error) => {
      assert.ok(error instanceof ReceiptReadError)
      assert.equal(error.status, status)
      assert.match(error.message, message)
      assert.doesNotMatch(error.message, /details that must not reach the page/)
      return true
    })
  })
}

test('an unexpected failure is also reported plainly', async () => {
  console.error = () => {}
  const reader = createReceiptReader({ client: stubClient(new TypeError('x is not a function')) })
  await assert.rejects(reader(files.jpeg, 'image/jpeg'), (error) => error.status === 502 && !/not a function/.test(error.message))
})

// --- The real SDK, with only the network replaced -------------------------

const sdkWithFakeNetwork = (respond) => {
  const sent = []
  const fakeFetch = async (url, options) => {
    sent.push({ url: String(url), options, body: JSON.parse(options.body) })
    const { status = 200, body } = respond(sent.length)
    return new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } })
  }
  const client = new Anthropic({ apiKey: 'test-key', fetch: fakeFetch, maxRetries: 0 })
  return { client, sent }
}

const messageResponse = (input) => ({
  id: 'msg_test',
  type: 'message',
  role: 'assistant',
  model: DEFAULT_MODEL,
  content: [{ type: 'tool_use', id: 'toolu_test', name: 'record_receipt', input }],
  stop_reason: 'tool_use',
  usage: { input_tokens: 10, output_tokens: 10 },
})
const errorResponse = (type, message) => ({ type: 'error', error: { type, message } })

test('through the real SDK, the request is built correctly and the answer is read back', async () => {
  const { client, sent } = sdkWithFakeNetwork(() => ({ body: messageResponse(reading) }))
  const result = await createReceiptReader({ client })(files.jpeg, 'image/jpeg')
  assert.deepEqual(result, reading)

  assert.match(sent[0].url, /\/v1\/messages$/)
  const headers = sent[0].options.headers instanceof Headers ? Object.fromEntries(sent[0].options.headers) : sent[0].options.headers
  assert.ok(JSON.stringify(headers).includes('test-key'), 'the API key is sent with the request')
  const body = sent[0].body
  assert.equal(body.model, DEFAULT_MODEL)
  assert.deepEqual(body.tool_choice, { type: 'tool', name: 'record_receipt' })
  assert.equal(body.messages[0].content[0].source.data, files.jpeg.toString('base64'))
})

for (const [label, status, type, expectedStatus, message] of [
  ['429 rate limit', 429, 'rate_limit_error', 503, /busy right now/],
  ['401 bad key', 401, 'authentication_error', 503, /isn't set up correctly/],
  ['403 no permission', 403, 'permission_error', 503, /isn't set up correctly/],
  ['400 bad image', 400, 'invalid_request_error', 422, /Try another one/],
  ['500 server error', 500, 'api_error', 502, /Try again\.$/],
  ['529 overloaded', 529, 'overloaded_error', 502, /Try again\.$/],
]) {
  test(`through the real SDK, a ${label} response becomes a plain message`, async () => {
    console.error = () => {}
    const { client } = sdkWithFakeNetwork(() => ({ status, body: errorResponse(type, 'raw provider detail') }))
    await assert.rejects(createReceiptReader({ client })(files.jpeg, 'image/jpeg'), (error) => {
      assert.ok(error instanceof ReceiptReadError)
      assert.equal(error.status, expectedStatus)
      assert.match(error.message, message)
      assert.doesNotMatch(error.message, /raw provider detail/)
      return true
    })
  })
}

test('through the real SDK, a dropped connection becomes a plain message', async () => {
  console.error = () => {}
  const client = new Anthropic({
    apiKey: 'test-key',
    maxRetries: 0,
    fetch: async () => { throw new TypeError('fetch failed') },
  })
  await assert.rejects(createReceiptReader({ client })(files.jpeg, 'image/jpeg'), (error) =>
    error instanceof ReceiptReadError && error.status === 502 && !/fetch failed/.test(error.message))
})
