// Client-side AI-like image generation using Canvas
// Supports multiple style variants with deterministic rendering

export type ImageStyle = 'poster' | 'gradient' | 'minimal' | 'vibrant';

export interface GenerateImageOptions {
  prompt: string;
  style: ImageStyle;
  width?: number;
  height?: number;
  onProgress?: (percentage: number) => void;
}

export async function generateImage(options: GenerateImageOptions): Promise<string> {
  const {
    prompt,
    style,
    width = 1024,
    height = 1024,
    onProgress,
  } = options;

  // Simulate progress
  if (onProgress) onProgress(10);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  if (onProgress) onProgress(30);

  // Generate deterministic colors from prompt
  const hash = hashString(prompt);
  const hue1 = (hash % 360);
  const hue2 = ((hash * 7) % 360);
  const hue3 = ((hash * 13) % 360);

  if (onProgress) onProgress(50);

  // Render based on style
  switch (style) {
    case 'poster':
      renderPosterStyle(ctx, width, height, prompt, hue1, hue2);
      break;
    case 'gradient':
      renderGradientStyle(ctx, width, height, prompt, hue1, hue2, hue3);
      break;
    case 'minimal':
      renderMinimalStyle(ctx, width, height, prompt, hue1);
      break;
    case 'vibrant':
      renderVibrantStyle(ctx, width, height, prompt, hue1, hue2, hue3);
      break;
  }

  if (onProgress) onProgress(90);

  // Convert to data URL
  const dataUrl = canvas.toDataURL('image/png');

  if (onProgress) onProgress(100);

  return dataUrl;
}

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function renderPosterStyle(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  prompt: string,
  hue1: number,
  hue2: number
) {
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, `hsl(${hue1}, 70%, 30%)`);
  gradient.addColorStop(1, `hsl(${hue2}, 60%, 20%)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Geometric shapes
  ctx.fillStyle = `hsla(${hue1}, 80%, 50%, 0.3)`;
  ctx.fillRect(width * 0.1, height * 0.2, width * 0.3, height * 0.6);

  ctx.fillStyle = `hsla(${hue2}, 70%, 60%, 0.2)`;
  ctx.beginPath();
  ctx.arc(width * 0.7, height * 0.5, width * 0.25, 0, Math.PI * 2);
  ctx.fill();

  // Text
  renderText(ctx, prompt, width, height, '#ffffff');
}

function renderGradientStyle(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  prompt: string,
  hue1: number,
  hue2: number,
  hue3: number
) {
  // Multi-color gradient
  const gradient = ctx.createRadialGradient(
    width * 0.3, height * 0.3, 0,
    width * 0.5, height * 0.5, width * 0.7
  );
  gradient.addColorStop(0, `hsl(${hue1}, 80%, 60%)`);
  gradient.addColorStop(0.5, `hsl(${hue2}, 75%, 55%)`);
  gradient.addColorStop(1, `hsl(${hue3}, 70%, 40%)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Overlay pattern
  for (let i = 0; i < 20; i++) {
    const x = (width / 20) * i;
    ctx.strokeStyle = `hsla(${hue1}, 60%, 80%, 0.1)`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }

  // Text
  renderText(ctx, prompt, width, height, '#ffffff');
}

function renderMinimalStyle(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  prompt: string,
  hue1: number
) {
  // Clean background
  ctx.fillStyle = `hsl(${hue1}, 10%, 95%)`;
  ctx.fillRect(0, 0, width, height);

  // Simple accent line
  ctx.strokeStyle = `hsl(${hue1}, 70%, 50%)`;
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(width * 0.1, height * 0.5);
  ctx.lineTo(width * 0.9, height * 0.5);
  ctx.stroke();

  // Text
  renderText(ctx, prompt, width, height, `hsl(${hue1}, 60%, 30%)`);
}

function renderVibrantStyle(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  prompt: string,
  hue1: number,
  hue2: number,
  hue3: number
) {
  // Bright background
  ctx.fillStyle = `hsl(${hue1}, 90%, 50%)`;
  ctx.fillRect(0, 0, width, height);

  // Random shapes
  const hash = hashString(prompt);
  for (let i = 0; i < 15; i++) {
    const x = ((hash * (i + 1)) % width);
    const y = ((hash * (i + 3)) % height);
    const size = 50 + ((hash * (i + 7)) % 150);
    const hue = [hue1, hue2, hue3][i % 3];

    ctx.fillStyle = `hsla(${hue}, 85%, 60%, 0.4)`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  // Text
  renderText(ctx, prompt, width, height, '#ffffff');
}

function renderText(
  ctx: CanvasRenderingContext2D,
  text: string,
  width: number,
  height: number,
  color: string
) {
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Responsive font size
  const fontSize = Math.min(width, height) / 15;
  ctx.font = `bold ${fontSize}px sans-serif`;

  // Word wrap
  const maxWidth = width * 0.8;
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }

  // Draw lines
  const lineHeight = fontSize * 1.3;
  const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;

  lines.forEach((line, index) => {
    ctx.fillText(line, width / 2, startY + index * lineHeight);
  });
}
