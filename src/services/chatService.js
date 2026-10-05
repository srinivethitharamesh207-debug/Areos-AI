// src/services/chatService.js - Real-time SSE Chat Service for Areos AI
// Communicates exclusively via POST /api/chat with the secure backend proxy.

/**
 * Sends messages to Areos AI backend proxy and streams the response token by token via SSE.
 *
 * @param {Object} options
 * @param {Array} options.messages - Multi-turn conversation array ({ role, content, attachments })
 * @param {string} [options.model] - Optional model identifier override
 * @param {boolean} [options.demoMode] - Optional demo mode flag
 * @param {Function} options.onChunk - Callback invoked with accumulated text so far
 * @param {Function} [options.onStatus] - Callback invoked when a tool status chip changes (e.g. "Using portfolio data...")
 * @param {Function} [options.onFollowups] - Callback invoked when dynamic follow-up suggestions arrive
 * @param {AbortSignal} [options.signal] - Abort signal for cancellation
 * @returns {Promise<string>} Full response text
 */
export async function sendMessage({
  messages = [],
  model,
  demoMode = false,
  onChunk,
  onStatus,
  onFollowups,
  signal
}) {
  const response = await fetch('/api/chat', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      messages,
      model,
      demoMode
    }),
    signal
  });

  if (!response.ok) {
    let errMessage = `Server error HTTP ${response.status}`;
    try {
      const errJson = await response.json();
      errMessage = errJson.message || errMessage;
    } catch {
      // ignore json parse error on non-json status
    }
    throw new Error(`Areos AI is offline: ${errMessage}`);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder('utf-8');
  let accumulatedText = '';
  let currentEvent = 'message';
  let buffer = '';

  try {
    while (true) {
      if (signal && signal.aborted) {
        throw new DOMException('Aborted by user', 'AbortError');
      }

      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop(); // keep last incomplete line

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();

        if (trimmed.startsWith('event:')) {
          currentEvent = trimmed.slice(6).trim();
          continue;
        }

        if (trimmed.startsWith('data:')) {
          const dataStr = trimmed.slice(5).trim();
          if (!dataStr) continue;

          let data = {};
          try {
            data = JSON.parse(dataStr);
          } catch {
            data = { raw: dataStr };
          }

          if (currentEvent === 'error') {
            throw new Error(data.message || 'Areos AI is offline due to an inference error.');
          }

          if (currentEvent === 'status') {
            if (typeof onStatus === 'function') {
              onStatus(data.message || 'Processing...', data.tool || null);
            }
          } else if (currentEvent === 'chunk') {
            if (data.text) {
              accumulatedText += data.text;
              if (typeof onChunk === 'function') {
                onChunk(accumulatedText);
              }
            }
          } else if (currentEvent === 'followups') {
            if (Array.isArray(data.suggestions) && typeof onFollowups === 'function') {
              onFollowups(data.suggestions);
            }
          } else if (currentEvent === 'done') {
            // Completed successfully
          }

          // Reset event to default after handling data
          currentEvent = 'message';
        }
      }
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      throw err;
    }
    throw err;
  }

  return accumulatedText;
}
