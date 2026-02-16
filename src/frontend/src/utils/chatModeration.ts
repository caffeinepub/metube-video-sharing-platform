/**
 * Chat moderation utility for checking chat messages for sexually explicit content
 * before posting to the AI Chat Room.
 * 
 * This performs client-side validation to prevent unnecessary network calls
 * when content violates the chat room policy.
 */

const SEXUAL_KEYWORDS = [
  'sex',
  'porn',
  'cock',
  'sexy',
  'genital',
  'pussy',
  'penis',
  'vagina',
  'anal',
  'nude',
  'naked',
  'fuck',
  'fucking',
  'fucked',
  'dick',
];

/**
 * Checks if text contains sexually explicit keywords (case-insensitive)
 */
function containsSexualKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return SEXUAL_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

/**
 * Validates a chat message for sexually explicit content
 * Returns { allowed: true } if message is acceptable
 * Returns { allowed: false, error: string } if message is blocked
 */
export function validateChatMessage(message: string): { allowed: boolean; error?: string } {
  const errorMessage = 
    'Sexually explicit content is not allowed in the chat room. ' +
    'Please revise your message to remove explicit content.';

  if (containsSexualKeywords(message)) {
    return { allowed: false, error: errorMessage };
  }

  return { allowed: true };
}
