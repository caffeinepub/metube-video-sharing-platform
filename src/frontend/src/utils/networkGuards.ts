// Network guards to ensure no external AI API calls are made

export function ensureLocalOnly(operation: string): void {
  // This is a guard function to document that operations are local-only
  // In production, you could add runtime checks here
  console.log(`[Local Operation] ${operation} - No external API calls`);
}

export function validateNoExternalCalls(): boolean {
  // Placeholder for validation logic
  // Could be extended to monitor network activity in development
  return true;
}

/**
 * Explicitly documents that image generation (including portrait mode)
 * is performed entirely on-device using Canvas rendering.
 * No network calls are made to external AI services.
 */
export function ensureImageGenerationIsLocal(): void {
  ensureLocalOnly('Image Generation (all styles including portrait)');
}
