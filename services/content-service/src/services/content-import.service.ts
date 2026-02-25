import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ImportStrategy } from '../import-strategies/import-strategy.interface';
import { ContentService } from '../content.service';
import { YouTubeImportStrategy } from '../import-strategies/youtube.strategy';
import { RSSImportStrategy } from '../import-strategies/rss.strategy';
import { ManualImportStrategy } from '../import-strategies/manual.strategy';

@Injectable()
export class ContentImportService {
  private readonly logger = new Logger(ContentImportService.name);
  private readonly strategies: Map<string, ImportStrategy>;

  constructor(
    private contentService: ContentService,
    private youtubeStrategy: YouTubeImportStrategy,
    private rssStrategy: RSSImportStrategy,
    private manualStrategy: ManualImportStrategy,
  ) {
    this.strategies = new Map<string, ImportStrategy>();
    this.registerStrategy(this.youtubeStrategy);
    this.registerStrategy(this.rssStrategy);
    this.registerStrategy(this.manualStrategy);
  }

  private registerStrategy(strategy: ImportStrategy): void {
    this.strategies.set(strategy.sourceName, strategy);
  }

  getAvailableStrategies(): string[] {
    return [...this.strategies.keys()];
  }

  async importContent(
    sourceName: string,
    config: Record<string, any>,
    userId: string,
  ): Promise<{ imported: number; errors: number }> {
    const strategy = this.strategies.get(sourceName);
    if (!strategy) {
      throw new BadRequestException(
        `Unknown import source: ${sourceName}. Available: ${this.getAvailableStrategies().join(', ')}`,
      );
    }

    const isValid = await strategy.validate(config);
    if (!isValid) {
      throw new BadRequestException(`Invalid configuration for ${sourceName} import`);
    }

    const items = await strategy.import(config);
    let imported = 0;
    let errors = 0;

    for (const item of items) {
      try {
        await this.contentService.create(item as any, userId);
        imported++;
      } catch (error) {
        this.logger.error(`Failed to import item "${item.title}": ${error.message}`);
        errors++;
      }
    }

    this.logger.log(`Import from ${sourceName} complete: ${imported} imported, ${errors} errors`);
    return { imported, errors };
  }
}
