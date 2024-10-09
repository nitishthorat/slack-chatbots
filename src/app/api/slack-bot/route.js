import { WebClient } from "@slack/web-api";
import crypto from "crypto";
import { OpenAI } from "openai"; // Import OpenAI

const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Store processed event IDs to avoid duplicates (In-memory for demo purposes)
const processedEventIds = new Set();

async function getRawBody(req) {
  const chunks = [];
  const readable = req.body;
  const reader = readable.getReader();
  let result = await reader.read();

  while (!result.done) {
    chunks.push(Buffer.from(result.value));
    result = await reader.read();
  }

  return Buffer.concat(chunks).toString("utf8");
}

function verifySlackRequest(req, rawBody) {
  const slackSigningSecret = process.env.SLACK_SIGNING_SECRET;
  const slackSignature = req.headers.get("x-slack-signature");
  const slackRequestTimestamp = req.headers.get("x-slack-request-timestamp");

  if (!slackSigningSecret || !slackSignature || !slackRequestTimestamp) {
    throw new Error("Slack signing secret, signature, or timestamp missing");
  }

  const time = Math.floor(new Date().getTime() / 1000);
  if (Math.abs(time - slackRequestTimestamp) > 300) {
    throw new Error("Request timestamp is too old");
  }

  const sigBaseString = `v0:${slackRequestTimestamp}:${rawBody}`;
  const hmac = crypto.createHmac("sha256", slackSigningSecret);
  hmac.update(sigBaseString);
  const mySignature = `v0=${hmac.digest("hex")}`;

  if (
    crypto.timingSafeEqual(
      Buffer.from(mySignature),
      Buffer.from(slackSignature)
    )
  ) {
    return true;
  } else {
    throw new Error("Slack request signing verification failed");
  }
}

export async function POST(req) {
  try {
    const rawBody = await getRawBody(req);
    verifySlackRequest(req, rawBody);
    const event = JSON.parse(rawBody);

    // Detect and avoid retries based on Slack's retry headers
    const slackRetryNum = req.headers.get("x-slack-retry-num");
    if (slackRetryNum) {
      return new Response("Ignoring Slack retry", { status: 200 });
    }

    // Ignore already processed events using event_id
    if (processedEventIds.has(event.event_id)) {
      return new Response("Duplicate event detected and ignored", {
        status: 200,
      });
    }

    // Mark event as processed
    processedEventIds.add(event.event_id);

    if (event.type === "url_verification") {
      return new Response(JSON.stringify({ challenge: event.challenge }), {
        status: 200,
      });
    }

    if (event.type === "event_callback" && event.event.type === "message") {
      // Ignore bot messages and self-responses
      if (
        event.event.subtype === "bot_message" ||
        event.event.bot_id ||
        event.event.user === process.env.SLACK_BOT_USER_ID
      ) {
        return new Response("Ignored message from bot", { status: 200 });
      }

      // Respond with a basic message before OpenAI call (Optional)
      await slackClient.chat.postMessage({
        channel: event.event.channel,
        text: "Hello, I am a TestBot in training",
      });

      // Generate response using OpenAI API
      const openaiResponse = await openai.chat.completions.create({
        messages: [{ role: "user", content: event.event.text }],
        model: "gpt-3.5-turbo",
        max_tokens: 150,
      });

      const aiMessage = openaiResponse.choices[0].message.content.trim();

      await slackClient.chat.postMessage({
        channel: event.event.channel,
        text: aiMessage,
      });

      return new Response("Event processed", { status: 200 });
    }

    return new Response("Event type not handled", { status: 200 });
  } catch (error) {
    console.error("Error processing Slack event:", error);
    await slackClient.chat.postMessage({
      channel: event.event.channel,
      text: "Error processing OpenAI Response",
    });
    return new Response(`Error processing Slack event: ${error.stack}`, {
      status: 500,
    });
  }
}
