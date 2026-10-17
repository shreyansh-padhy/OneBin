export type WasteBin = 'compost' | 'recycling' | 'trash';

export interface ClassificationResult {
  bin: WasteBin;
  itemName: string;
  material: string;
  confidence: number; // 0.0 - 1.0
  rationale: string;
  warnings?: string[];
  lowConfidenceWarning: boolean;
}

export interface ClassifyRequest {
  image: string; // base64 data or data URL
  mimeType?: string;
}

export interface ClassifyErrorResponse {
  error: string;
  details?: string;
}
