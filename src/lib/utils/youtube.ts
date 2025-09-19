// YouTube URL parsing utilities

export interface YouTubeVideoInfo {
  videoId: string;
  url: string;
  isValid: boolean;
}

/**
 * Extract video ID from various YouTube URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://youtube.com/watch?v=VIDEO_ID
 * - https://m.youtube.com/watch?v=VIDEO_ID
 */
export function extractVideoId(url: string): string | null {
  if (!url || typeof url !== 'string') {
    return null;
  }

  // Remove whitespace and convert to lowercase for matching
  const cleanUrl = url.trim();
  
  // Regular expressions for different YouTube URL formats
  const patterns = [
    // Standard YouTube URLs
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    // Short YouTube URLs
    /(?:https?:\/\/)?youtu\.be\/([a-zA-Z0-9_-]{11})/,
    // Mobile YouTube URLs
    /(?:https?:\/\/)?m\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    // YouTube URLs without www
    /(?:https?:\/\/)?youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    // Embedded YouTube URLs
    /(?:https?:\/\/)?(?:www\.)?youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = cleanUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

/**
 * Validate if a URL is a valid YouTube video URL
 */
export function isValidYouTubeUrl(url: string): boolean {
  const videoId = extractVideoId(url);
  return videoId !== null && videoId.length === 11;
}

/**
 * Parse YouTube URL and extract video information
 */
export function parseYouTubeUrl(url: string): YouTubeVideoInfo {
  const videoId = extractVideoId(url);
  const isValid = videoId !== null;

  return {
    videoId: videoId || '',
    url: url,
    isValid
  };
}

/**
 * Generate standard YouTube URL from video ID
 */
export function generateYouTubeUrl(videoId: string): string {
  if (!videoId || videoId.length !== 11) {
    throw new Error('Invalid YouTube video ID');
  }
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Generate YouTube embed URL from video ID
 */
export function generateYouTubeEmbedUrl(videoId: string): string {
  if (!videoId || videoId.length !== 11) {
    throw new Error('Invalid YouTube video ID');
  }
  return `https://www.youtube.com/embed/${videoId}`;
}

/**
 * Get video duration category based on estimated length
 * This is a rough estimation - actual duration would need YouTube API
 */
export function getVideoDurationCategory(url: string): 'short' | 'medium' | 'long' {
  // For now, we'll return 'medium' as default
  // In a real implementation, you'd call YouTube API to get actual duration
  return 'medium';
}

/**
 * Estimate number of sections based on video duration category
 */
export function estimateSectionCount(durationCategory: 'short' | 'medium' | 'long'): number {
  switch (durationCategory) {
    case 'short':
      return 2; // 1-2 sections for videos < 30 minutes
    case 'medium':
      return 3; // 3-4 sections for videos 30-60 minutes
    case 'long':
      return 5; // 4-5 sections for videos > 60 minutes
    default:
      return 3;
  }
}

/**
 * Clean and normalize YouTube URL for consistent storage
 */
export function normalizeYouTubeUrl(url: string): string {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error('Invalid YouTube URL');
  }
  return generateYouTubeUrl(videoId);
}
