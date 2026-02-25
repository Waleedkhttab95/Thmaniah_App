import { Injectable, Logger } from '@nestjs/common';
import { ImportStrategy, ImportedContent } from './import-strategy.interface';

@Injectable()
export class ManualImportStrategy implements ImportStrategy {
  private readonly logger = new Logger(ManualImportStrategy.name);
  readonly sourceName = 'manual';

  async validate(config: Record<string, any>): Promise<boolean> {
    if (!config.items || !Array.isArray(config.items)) {
      this.logger.error('Manual import requires an items array');
      return false;
    }
    return true;
  }

  async import(config: Record<string, any>): Promise<ImportedContent[]> {
    this.logger.log(`Manual import: ${config.items.length} items`);

    return config.items.map((item: any) => ({
      title: item.title,
      description: item.description,
      type: item.type || 'podcast',
      category: item.category || 'General',
      language: item.language || 'ar',
      duration: item.duration || 0,
      publishDate: item.publishDate ? new Date(item.publishDate) : new Date(),
      contentDetails: {
        tags: item.tags || [],
        thumbnail: item.thumbnail,
        videoUrl: item.videoUrl,
        source: 'manual',
      },
    }));
  }
}
