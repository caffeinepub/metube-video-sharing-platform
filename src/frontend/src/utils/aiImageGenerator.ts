// Client-side AI-like image generation using Canvas
// Supports multiple style variants with deterministic rendering

export type ImageStyle = 'poster' | 'gradient' | 'minimal' | 'vibrant' | 'portrait';
export type SubjectGender = 'auto' | 'neutral' | 'woman' | 'man';

export interface GenerateImageOptions {
  prompt: string;
  style: ImageStyle;
  subjectGender?: SubjectGender;
  width?: number;
  height?: number;
  onProgress?: (percentage: number) => void;
}

// Sexual keywords that should be ignored for gender inference
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

// Gendered terms for Auto inference
const WOMAN_TERMS = ['woman', 'women', 'girl', 'girls', 'female', 'lady', 'ladies', 'she', 'her'];
const MAN_TERMS = ['man', 'men', 'boy', 'boys', 'male', 'gentleman', 'gentlemen', 'he', 'him', 'his'];

/**
 * Infers gender from prompt based on gendered terms only (ignores sexual keywords)
 * Returns 'neutral' if no gendered terms found or only sexual keywords present
 */
function inferGenderFromPrompt(prompt: string): 'neutral' | 'woman' | 'man' {
  const lowerPrompt = prompt.toLowerCase();
  
  // Remove sexual keywords from consideration
  let cleanedPrompt = lowerPrompt;
  for (const keyword of SEXUAL_KEYWORDS) {
    cleanedPrompt = cleanedPrompt.replace(new RegExp(`\\b${keyword}\\b`, 'gi'), '');
  }
  
  // Check for gendered terms in cleaned prompt
  const hasWomanTerms = WOMAN_TERMS.some(term => cleanedPrompt.includes(term));
  const hasManTerms = MAN_TERMS.some(term => cleanedPrompt.includes(term));
  
  // If both or neither, default to neutral
  if (hasWomanTerms && hasManTerms) return 'neutral';
  if (hasWomanTerms) return 'woman';
  if (hasManTerms) return 'man';
  
  return 'neutral';
}

export async function generateImage(options: GenerateImageOptions): Promise<string> {
  const {
    prompt,
    style,
    subjectGender = 'auto',
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

  // Determine effective gender for rendering
  let effectiveGender: 'neutral' | 'woman' | 'man';
  if (subjectGender === 'auto') {
    effectiveGender = inferGenderFromPrompt(prompt);
  } else {
    effectiveGender = subjectGender;
  }

  // Generate deterministic colors from prompt
  const hash = hashString(prompt);
  const hue1 = (hash % 360);
  const hue2 = ((hash * 7) % 360);
  const hue3 = ((hash * 13) % 360);

  if (onProgress) onProgress(50);

  // Render based on style
  switch (style) {
    case 'portrait':
      renderPortraitStyle(ctx, width, height, prompt, hue1, hue2, effectiveGender);
      break;
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

function renderPortraitStyle(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  prompt: string,
  hue1: number,
  hue2: number,
  gender: 'neutral' | 'woman' | 'man'
) {
  // Background gradient
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, `hsl(${hue1}, 60%, 85%)`);
  gradient.addColorStop(1, `hsl(${hue2}, 50%, 75%)`);
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Draw portrait silhouette based on gender
  const centerX = width / 2;
  const centerY = height / 2;
  const scale = Math.min(width, height) / 3;

  ctx.fillStyle = `hsl(${hue1}, 40%, 40%)`;
  
  // Head (circle)
  ctx.beginPath();
  ctx.arc(centerX, centerY - scale * 0.4, scale * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // Body/shoulders
  ctx.beginPath();
  ctx.moveTo(centerX, centerY + scale * 0.1);
  
  if (gender === 'woman') {
    // Woman silhouette - longer hair, curved shoulders
    // Hair
    ctx.beginPath();
    ctx.ellipse(centerX, centerY - scale * 0.4, scale * 0.45, scale * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    
    // Shoulders with curves
    ctx.beginPath();
    ctx.moveTo(centerX - scale * 0.6, centerY + scale * 0.3);
    ctx.quadraticCurveTo(centerX - scale * 0.4, centerY + scale * 0.1, centerX, centerY + scale * 0.15);
    ctx.quadraticCurveTo(centerX + scale * 0.4, centerY + scale * 0.1, centerX + scale * 0.6, centerY + scale * 0.3);
    ctx.lineTo(centerX + scale * 0.6, centerY + scale * 0.8);
    ctx.lineTo(centerX - scale * 0.6, centerY + scale * 0.8);
    ctx.closePath();
    ctx.fill();
  } else if (gender === 'man') {
    // Man silhouette - short hair, broader shoulders
    // Short hair
    ctx.beginPath();
    ctx.arc(centerX, centerY - scale * 0.4, scale * 0.38, 0, Math.PI * 2);
    ctx.fill();
    
    // Broader shoulders
    ctx.beginPath();
    ctx.moveTo(centerX - scale * 0.7, centerY + scale * 0.3);
    ctx.lineTo(centerX - scale * 0.5, centerY + scale * 0.1);
    ctx.lineTo(centerX, centerY + scale * 0.15);
    ctx.lineTo(centerX + scale * 0.5, centerY + scale * 0.1);
    ctx.lineTo(centerX + scale * 0.7, centerY + scale * 0.3);
    ctx.lineTo(centerX + scale * 0.7, centerY + scale * 0.8);
    ctx.lineTo(centerX - scale * 0.7, centerY + scale * 0.8);
    ctx.closePath();
    ctx.fill();
  } else {
    // Neutral silhouette - simple geometric shape
    // Simple head
    ctx.beginPath();
    ctx.arc(centerX, centerY - scale * 0.4, scale * 0.35, 0, Math.PI * 2);
    ctx.fill();
    
    // Simple body
    ctx.beginPath();
    ctx.moveTo(centerX - scale * 0.5, centerY + scale * 0.2);
    ctx.lineTo(centerX - scale * 0.5, centerY + scale * 0.8);
    ctx.lineTo(centerX + scale * 0.5, centerY + scale * 0.8);
    ctx.lineTo(centerX + scale * 0.5, centerY + scale * 0.2);
    ctx.closePath();
    ctx.fill();
  }

  // Decorative frame
  ctx.strokeStyle = `hsl(${hue2}, 60%, 50%)`;
  ctx.lineWidth = 8;
  ctx.strokeRect(width * 0.1, height * 0.1, width * 0.8, height * 0.8);

  // Text at bottom
  ctx.fillStyle = `hsl(${hue1}, 50%, 30%)`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const fontSize = Math.min(width, height) / 20;
  ctx.font = `bold ${fontSize}px sans-serif`;
  ctx.fillText(prompt.substring(0, 50), width / 2, height * 0.92);
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
