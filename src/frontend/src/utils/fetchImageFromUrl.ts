// Client-side image URL fetching and validation

export interface FetchedImage {
  image: HTMLImageElement;
  width: number;
  height: number;
}

export async function fetchImageFromUrl(url: string): Promise<FetchedImage> {
  if (!url || !url.trim()) {
    throw new Error('Image URL is required');
  }

  // Basic URL validation
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('Invalid URL format');
  }

  // Only allow http/https protocols
  if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
    throw new Error('Only HTTP and HTTPS URLs are supported');
  }

  try {
    // Fetch the image
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.startsWith('image/')) {
      throw new Error('URL does not point to a valid image (invalid content type)');
    }

    // Get blob
    const blob = await response.blob();
    
    // Validate it's actually an image by loading it
    const image = await loadImageFromBlob(blob);
    
    return {
      image,
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
  } catch (error: any) {
    if (error.message.includes('CORS')) {
      throw new Error('Image URL is not accessible due to CORS restrictions. Please use a different image or host it on a CORS-enabled server.');
    }
    if (error.message.includes('Failed to fetch')) {
      throw new Error('Unable to fetch image. Please check the URL and try again.');
    }
    throw error;
  }
}

function loadImageFromBlob(blob: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);
    
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to decode image. The file may be corrupted or in an unsupported format.'));
    };
    
    img.src = url;
  });
}
