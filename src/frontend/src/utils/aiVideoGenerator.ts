// Client-side video generation using Canvas and MediaRecorder
import type { FetchedImage } from './fetchImageFromUrl';

export interface VideoGenerationOptions {
  title: string;
  text: string;
  duration: number; // in seconds
  resolution?: { width: number; height: number };
  backgroundImage?: FetchedImage;
}

export interface GeneratedVideo {
  file: File;
  previewUrl: string;
  metadata: {
    resolution: { width: number; height: number };
    duration: number;
    fallbackOccurred: boolean;
  };
}

export async function generateVideo(options: VideoGenerationOptions): Promise<GeneratedVideo> {
  const { title, text, duration, resolution, backgroundImage } = options;
  
  // Determine target resolution with 1080p cap
  const targetResolution = resolution || { width: 1280, height: 720 };
  const cappedWidth = Math.min(targetResolution.width, 1920);
  const cappedHeight = Math.min(targetResolution.height, 1080);
  
  // Create canvas for video rendering
  const canvas = document.createElement('canvas');
  canvas.width = cappedWidth;
  canvas.height = cappedHeight;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Canvas context not available');
  }
  
  let fallbackOccurred = false;
  let actualWidth = cappedWidth;
  let actualHeight = cappedHeight;
  
  // Try to setup MediaRecorder with requested resolution
  let stream: MediaStream;
  let mediaRecorder: MediaRecorder;
  
  try {
    stream = canvas.captureStream(30); // 30 FPS
    
    // Try VP9 first for better quality
    let mimeType = 'video/webm;codecs=vp9';
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      mimeType = 'video/webm;codecs=vp8';
      if (!MediaRecorder.isTypeSupported(mimeType)) {
        mimeType = 'video/webm';
      }
    }
    
    mediaRecorder = new MediaRecorder(stream, {
      mimeType,
      videoBitsPerSecond: cappedWidth >= 1920 ? 5000000 : 2500000,
    });
  } catch (error) {
    // Fallback to 720p if 1080p fails
    if (cappedWidth >= 1920 || cappedHeight >= 1080) {
      fallbackOccurred = true;
      actualWidth = 1280;
      actualHeight = 720;
      canvas.width = actualWidth;
      canvas.height = actualHeight;
      
      stream = canvas.captureStream(30);
      mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'video/webm',
        videoBitsPerSecond: 2500000,
      });
    } else {
      throw new Error('MediaRecorder not supported on this device');
    }
  }
  
  const chunks: Blob[] = [];
  
  return new Promise((resolve, reject) => {
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: 'video/webm' });
      const file = new File([blob], `${title.replace(/[^a-z0-9]/gi, '_')}.webm`, {
        type: 'video/webm',
      });
      const previewUrl = URL.createObjectURL(blob);
      resolve({
        file,
        previewUrl,
        metadata: {
          resolution: { width: actualWidth, height: actualHeight },
          duration,
          fallbackOccurred,
        },
      });
    };
    
    mediaRecorder.onerror = () => {
      reject(new Error('MediaRecorder error during video generation'));
    };
    
    // Start recording
    mediaRecorder.start();
    
    // Animation loop
    const fps = 30;
    const totalFrames = duration * fps;
    let currentFrame = 0;
    
    const animate = () => {
      if (currentFrame >= totalFrames) {
        mediaRecorder.stop();
        return;
      }
      
      // Clear canvas
      ctx.fillStyle = '#1a1a2e';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw background
      if (backgroundImage) {
        // Draw background image with cover/center-crop
        drawImageCover(ctx, backgroundImage.image, canvas.width, canvas.height);
        
        // Add semi-transparent overlay for text readability
        ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      } else {
        // Draw animated background gradient
        const progress = currentFrame / totalFrames;
        const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        gradient.addColorStop(0, `hsl(${progress * 360}, 70%, 30%)`);
        gradient.addColorStop(1, `hsl(${(progress * 360 + 180) % 360}, 70%, 20%)`);
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
      
      // Scale font sizes based on resolution
      const scaleFactor = canvas.width / 1280;
      const titleFontSize = Math.floor(72 * scaleFactor);
      const textFontSize = Math.floor(36 * scaleFactor);
      const lineHeight = Math.floor(50 * scaleFactor);
      
      // Draw title
      ctx.fillStyle = '#ffffff';
      ctx.font = `bold ${titleFontSize}px Arial`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 10;
      ctx.fillText(title, canvas.width / 2, canvas.height / 3);
      ctx.shadowBlur = 0;
      
      // Draw text content with word wrap
      ctx.font = `${textFontSize}px Arial`;
      const maxWidth = canvas.width - (200 * scaleFactor);
      const words = text.split(' ');
      let line = '';
      let y = canvas.height / 2;
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        
        if (metrics.width > maxWidth && i > 0) {
          ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
          ctx.shadowBlur = 8;
          ctx.fillText(line, canvas.width / 2, y);
          ctx.shadowBlur = 0;
          line = words[i] + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 8;
      ctx.fillText(line, canvas.width / 2, y);
      ctx.shadowBlur = 0;
      
      // Draw progress indicator
      const progress = currentFrame / totalFrames;
      const barWidth = Math.floor(400 * scaleFactor);
      const barHeight = Math.floor(8 * scaleFactor);
      const barX = (canvas.width - barWidth) / 2;
      const barY = canvas.height - (100 * scaleFactor);
      
      ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.fillRect(barX, barY, barWidth, barHeight);
      
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(barX, barY, barWidth * progress, barHeight);
      
      currentFrame++;
      requestAnimationFrame(animate);
    };
    
    animate();
  });
}

function drawImageCover(
  ctx: CanvasRenderingContext2D,
  image: HTMLImageElement,
  canvasWidth: number,
  canvasHeight: number
) {
  const imgAspect = image.width / image.height;
  const canvasAspect = canvasWidth / canvasHeight;
  
  let drawWidth: number;
  let drawHeight: number;
  let offsetX = 0;
  let offsetY = 0;
  
  if (imgAspect > canvasAspect) {
    // Image is wider than canvas
    drawHeight = canvasHeight;
    drawWidth = image.width * (canvasHeight / image.height);
    offsetX = (canvasWidth - drawWidth) / 2;
  } else {
    // Image is taller than canvas
    drawWidth = canvasWidth;
    drawHeight = image.height * (canvasWidth / image.width);
    offsetY = (canvasHeight - drawHeight) / 2;
  }
  
  ctx.drawImage(image, offsetX, offsetY, drawWidth, drawHeight);
}
