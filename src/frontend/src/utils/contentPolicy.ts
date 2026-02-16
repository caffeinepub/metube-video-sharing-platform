/**
 * Content policy utilities for AI generation guidance.
 * 
 * NOTE: This file provides permissive guidance for AI generation prompts.
 * For upload/save metadata moderation, see uploadModeration.ts
 */

/**
 * Returns a generic community guideline message for AI generation
 */
export function getContentPolicyMessage(): string {
  return 'Please use AI generation features responsibly and in accordance with community guidelines.';
}

/**
 * Validates AI generation prompts (permissive - no keyword blocking)
 * Returns { allowed: true } for all prompts
 */
export function validateGenerationPrompt(prompt: string): { allowed: boolean; message?: string } {
  // AI generation is permissive - no keyword blocking
  return { allowed: true };
}

/**
 * Legacy function for backward compatibility
 * Always returns non-blocking result
 */
export function checkContentPolicy(text: string): { blocked: boolean; reason?: string } {
  return { blocked: false };
}
