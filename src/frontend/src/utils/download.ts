/**
 * Utility functions for downloading files (videos, images) to the user's device
 */

/**
 * Downloads a Blob or File to the user's device
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Downloads a data URL as a PNG file
 */
export function downloadDataUrlAsPNG(dataUrl: string, filename: string): void {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename.endsWith('.png') ? filename : `${filename}.png`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Downloads an image from a URL (data URL or regular URL) as PNG
 */
export async function downloadImageAsPNG(imageUrl: string, filename: string): Promise<void> {
  // If it's a data URL, download directly
  if (imageUrl.startsWith('data:')) {
    downloadDataUrlAsPNG(imageUrl, filename);
    return;
  }

  // Otherwise, fetch and convert to blob
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      throw new Error('Failed to fetch image');
    }
    const blob = await response.blob();
    downloadBlob(blob, filename.endsWith('.png') ? filename : `${filename}.png`);
  } catch (error) {
    throw new Error('Failed to download image');
  }
}

/**
 * Sanitizes a string for use in a filename
 */
export function sanitizeFilename(name: string): string {
  return name
    .replace(/[^a-z0-9_\-]/gi, '_')
    .replace(/_+/g, '_')
    .substring(0, 50);
}

/**
 * Generates a filename with timestamp
 */
export function generateFilenameWithTimestamp(prefix: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').substring(0, 19);
  return `${prefix}_${timestamp}.${extension}`;
}
