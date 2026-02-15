// Local content policy utilities
// Note: Keyword-based blocking has been removed per user request

export function containsBlockedContent(text: string): boolean {
  // No longer blocks content based on keywords
  return false;
}

export function getContentPolicyMessage(): string {
  return 'Please ensure your content follows community guidelines.';
}

export function getContentPolicyNote(): string {
  return 'Note: Please use AI generation features responsibly.';
}
