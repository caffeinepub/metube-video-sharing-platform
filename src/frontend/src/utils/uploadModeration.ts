/**
 * Upload moderation utility for checking metadata (title, description, tags)
 * for sexually explicit content before upload/save operations.
 * 
 * NOTE: This is ONLY for upload/save metadata validation, NOT for AI generation prompts.
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
 * Checks if text contains sexually explicit keywords
 */
function containsSexualKeywords(text: string): boolean {
  const lowerText = text.toLowerCase();
  return SEXUAL_KEYWORDS.some(keyword => lowerText.includes(keyword));
}

/**
 * Validates metadata for sexually explicit content
 * Returns { allowed: true } if content is acceptable
 * Returns { allowed: false, error: string } if content is blocked
 */
export function validateUploadMetadata(metadata: {
  title: string;
  description: string;
  tags: string[];
}): { allowed: boolean; error?: string } {
  const errorMessage = 
    'Sexually explicit content is not permitted on ArtificialTV. ' +
    'Please revise the metadata (title/description/tags) to remove explicit content. ' +
    'Note: This restriction applies to uploaded content metadata only.';

  // Check title
  if (containsSexualKeywords(metadata.title)) {
    return { allowed: false, error: errorMessage };
  }

  // Check description
  if (containsSexualKeywords(metadata.description)) {
    return { allowed: false, error: errorMessage };
  }

  // Check tags
  for (const tag of metadata.tags) {
    if (containsSexualKeywords(tag)) {
      return { allowed: false, error: errorMessage };
    }
  }

  return { allowed: true };
}
