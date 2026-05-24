import { load as parseHTML } from 'cheerio';
import { fetchApi } from '@libs/fetch';
import { Plugin } from '@/types/plugin';
import { defaultCover } from '@libs/defaultCover';
import { NovelStatus } from '@libs/novelStatus';

class TraduccionesMoonlight implements Plugin.PagePlugin {
  id = 'traduccionesmoonlight';
  name = 'Traducciones Moonlight';
  icon = 'src/es/traduccionesmoonlight/icon.png';
  site = 'https://traduccionesmoonlight.com';
  version = '1.0.0';

  async popularNovels(
    pageNo: number,
    { showLatestNovels }: Plugin.PopularNovelsOptions<typeof this.filters>,
  ): Promise<Plugin.NovelItem[]> {
    const url = `${this.site}/comics?page=${pageNo}`;
    const result = await fetchApi(url);
    const body = await result.text();
    const $ = parseHTML(body);

    const novels: Plugin.NovelItem[] = [];

    $('article.group').each((i, el) => {
      const a = $(el).find('a').first();
      const href = a.attr('href') || '';
      const title = $(el).find('a.uppercase').text().trim();
      const img =
        $(el).find('img').attr('src') ||
        $(el).find('img').attr('data-src') ||
        defaultCover;

      if (title && href) {
        novels.push({
          name: title,
          cover: img,
          path: href.replace(this.site, ''),
        });
      }
    });

    return novels;
  }

  async parseNovel(novelPath: string): Promise<Plugin.SourceNovel & { totalPages: number }> {
    const url = this.site + novelPath;
    const result = await fetchApi(url);
    const body = await result.text();
    const $ = parseHTML(body);

    const novel: Plugin.SourceNovel & { totalPages: number } = {
      path: novelPath,
      name: $('h1').first().text().trim(),
      cover:
        $('img[alt]').not('img[alt="Logo"]').first().attr('src') || defaultCover,
      summary: $('p.text-text-secondary').first().text().trim(),
      status: NovelStatus.Ongoing,
      author: 'N/A',
      genres: '',
      chapters: [],
      totalPages: 0,
    };

    // Géneros
    const genres: string[] = [];
    $("a[href*='genero']").each((i, el) => {
      genres.push($(el).text().trim());
    });
    novel.genres = genres.join(', ');

    // Estado
    const statusText = $('span.text-\\[10px\\]').text().toLowerCase();
    if (statusText.includes('finalizado') || statusText.includes('completado')) {
      novel.status = NovelStatus.Completed;
    } else if (statusText.includes('pausa')) {
      novel.status = NovelStatus.OnHiatus;
    }

    // Capítulos
    const chapters: Plugin.ChapterItem[] = [];
    $('a.group.relative.flex.items-center').each((i, el) => {
      const chapterPath = $(el).attr('href') || '';
      const chapterName =
        $(el).find('p').first().text().trim() || `Capítulo ${i + 1}`;
      const releaseTime = $(el).find('p').last().text().trim() || '';

      if (chapterPath) {
        chapters.push({
          name: chapterName,
          path: chapterPath.replace(this.site, ''),
          releaseTime,
          chapterNumber: i + 1,
        });
      }
    });

    novel.chapters = chapters;
    return novel;
  }

  async parsePage(novelPath: string, page: string): Promise<Plugin.SourcePage> {
    const url = `${this.site}${novelPath}?page=${page}`;
    const result = await fetchApi(url);
    const body = await result.text();
    const $ = parseHTML(body);

    const chapters: Plugin.ChapterItem[] = [];
    $('a.group.relative.flex.items-center').each((i, el) => {
      const chapterPath = $(el).attr('href') || '';
      const chapterName =
        $(el).find('p').first().text().trim() || `Capítulo ${i + 1}`;

      if (chapterPath) {
        chapters.push({
          name: chapterName,
          path: chapterPath.replace(this.site, ''),
          chapterNumber: i + 1,
        });
      }
    });

    return { chapters };
  }

  async parseChapter(chapterPath: string): Promise<string> {
    const url = this.site + chapterPath;
    const result = await fetchApi(url);
    const body = await result.text();
    const $ = parseHTML(body);

    const paragraphs: string[] = [];

    // Intentar primero con .read-novela
    let content = $('.read-novela p');

    // Si no hay contenido, intentar con párrafos con estilo justify
    if (!content.length) {
      content = $('p[style*="justify"]');
    }

    content.each((i, el) => {
      const text = $(el).text().trim();
      if (text) {
        paragraphs.push(`<p>${text}</p>`);
      }
    });

    return paragraphs.join('\n') || '<p>Contenido no disponible</p>';
  }

  async searchNovels(
    searchTerm: string,
    pageNo: number,
  ): Promise<Plugin.NovelItem[]> {
    const url = `${this.site}/comics?search=${encodeURIComponent(searchTerm)}&page=${pageNo}`;
    const result = await fetchApi(url);
    const body = await result.text();
    const $ = parseHTML(body);

    const novels: Plugin.NovelItem[] = [];

    $('article.group').each((i, el) => {
      const a = $(el).find('a').first();
      const href = a.attr('href') || '';
      const title = $(el).find('a.uppercase').text().trim();
      const img =
        $(el).find('img').attr('src') ||
        $(el).find('img').attr('data-src') ||
        defaultCover;

      if (title && href) {
        novels.push({
          name: title,
          cover: img,
          path: href.replace(this.site, ''),
        });
      }
    });

    return novels;
  }

  filters = {} as const;
}

export default new TraduccionesMoonlight();