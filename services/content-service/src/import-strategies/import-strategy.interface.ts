export interface ImportedContent {
  title: string;
  description: string;
  type: string;
  category: string;
  language: string;
  duration: number;
  publishDate: Date;
  contentDetails?: {
    tags?: string[];
    thumbnail?: string;
    videoUrl?: string;
    source: string;
  };
}

export interface ImportStrategy {
  readonly sourceName: string;
  validate(config: Record<string, any>): Promise<boolean>;
  import(config: Record<string, any>): Promise<ImportedContent[]>;
}
