export type Platform =
  | 'youtube'
  | 'tiktok'
  | 'instagram'
  | 'vimeo'
  | 'dailymotion'
  | 'reddit'
  | 'twitch'
  | 'kwai'
  | 'web';

export interface VideoTranscriptSegment {
  startTime: number;
  endTime: number;
  text: string;
}

export interface VideoTranscript {
  language: string;
  isVerified: boolean;
  segments: VideoTranscriptSegment[];
}

export interface VideoSearchResult {
  id: string;
  platform: Platform;
  externalId: string;
  title: string;
  description: string;
  originalUrl: string;
  thumbnailUrl: string;
  author: string;
  durationSeconds?: number;
  publishedAt?: string;
  viewsCount?: number;
  relevanceScore: number;
  matchType: 'exact_phrase' | 'text_match' | 'transcript_match' | 'semantic' | 'unverified';
  matchedSnippet?: string;
  matchedTimestamp?: number;
  transcript?: VideoTranscript;
}

export interface SearchQueryFilters {
  platforms?: Platform[];
  period?: '24h' | '7d' | '30d' | 'year' | 'all';
  duration?: 'short' | 'medium' | 'long' | 'all';
  language?: string;
  mode?: 'simple' | 'exact' | 'ai_semantic';
}

export interface SearchSessionStatus {
  sessionId: string;
  query: string;
  isCompleted: boolean;
  totalFound: number;
  providersQueried: string[];
  providersCompleted: string[];
  durationMs: number;
}

