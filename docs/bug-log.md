# Bug Log

## BUG-001: Model truncation without proper finish_reason on long prompts
* **Severity**: High
* **Status**: Open
* **Type**: AI Quality / API
* **Steps to Reproduce**: 
  1. Send a POST request to `/chat/completions` with a valid authorization token.
  2. Use a `model` of `llama3-8b-8192`.
  3. Include a very long `content` payload of exactly 8190 tokens.
* **Expected Result**: The API should either successfully generate a short response or reject the prompt as `tokens_exceeded`. If truncated, `finish_reason` should be `length`.
* **Actual Result**: The API returns a 200 OK, but the response `content` is entirely empty, and `finish_reason` is erroneously marked as `stop`.

## BUG-002: Null values accepted in `messages` array without validation error
* **Severity**: Medium
* **Status**: Open
* **Type**: API Validation
* **Steps to Reproduce**: 
  1. Send a POST request to `/chat/completions`.
  2. Include the payload: `{"model": "llama3-8b-8192", "messages": [null, {"role": "user", "content": "Hi"}]}`
* **Expected Result**: The API should return a 400 Bad Request indicating invalid schema inside the messages array.
* **Actual Result**: The API returns a 500 Internal Server Error, indicating an unhandled exception in the backend JSON parser.

## BUG-003: Rate Limit headers (x-ratelimit-remaining) are inconsistent
* **Severity**: Low
* **Status**: Open
* **Type**: Documentation / Response Headers
* **Steps to Reproduce**: 
  1. Send 5 sequential valid POST requests to `/chat/completions`.
  2. Inspect the HTTP response headers for `x-ratelimit-remaining`.
* **Expected Result**: The `x-ratelimit-remaining` integer should decrement sequentially (e.g., 99, 98, 97...).
* **Actual Result**: The header value jumps erratically (e.g., 99, 99, 97, 98, 95), likely due to multi-region caching out of sync.

## BUG-004: Inconsistent structure when prompt is pure emojis
* **Severity**: Medium
* **Status**: Open
* **Type**: AI Quality
* **Steps to Reproduce**: 
  1. Send a POST request to `/chat/completions`.
  2. Set prompt content to `🤔`.
* **Expected Result**: The model responds with text or asks for clarification in standard JSON format.
* **Actual Result**: The model sporadically returns an empty string `""` or hallucinates random unicode control characters, breaking JSON validation in some edge cases.

## BUG-005: Endpoint ignores unsupported models and defaults instead of throwing 404
* **Severity**: High
* **Status**: Open
* **Type**: API Validation
* **Steps to Reproduce**: 
  1. Send a POST request to `/chat/completions`.
  2. Provide a non-existent model name: `{"model": "gpt-99-turbo", ...}`.
* **Expected Result**: The API should return a 404 Model Not Found or 400 Bad Request.
* **Actual Result**: The API accepts the request and invisibly falls back to `llama3-8b-8192` returning a 200 OK, which breaks strict model-version auditing.
