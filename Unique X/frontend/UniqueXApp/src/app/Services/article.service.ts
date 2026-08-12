import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ArticleService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/articles`;

  getPublished()                            { return this.http.get<any[]>(this.base); }
  getAll()                                  { return this.http.get<any[]>(`${this.base}/all`); }
  getById(id: number)                       { return this.http.get<any>(`${this.base}/${id}`); }
  getRelated(id: number, take: number = 4)  { return this.http.get<any[]>(`${this.base}/${id}/related?take=${take}`); }
  create(fd: FormData)                      { return this.http.post<any>(this.base, fd); }
  update(id: number, fd: FormData)          { return this.http.put<any>(`${this.base}/${id}`, fd); }
  delete(id: number)                        { return this.http.delete(`${this.base}/${id}`); }
  reorder(orderedIds: number[])             { return this.http.put(`${this.base}/reorder`, orderedIds); }
  deleteAdBanner(id: number, slot: number)  { return this.http.delete(`${this.base}/${id}/ad/${slot}`); }

  getImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${this.base}/image/${url}`;
  }

  parseJson(json: string | null | undefined): any[] {
    if (!json) return [];
    try { return JSON.parse(json); } catch { return []; }
  }

  // [{ headline, text }, ...] - عدد مفتوح من عناوين وفقرات المقال
  getSections(article: any): { headline: string; text: string }[] {
    return this.parseJson(article?.sectionsJson);
  }

  // ["كلمة1", "كلمة2", ...] - الكلمات المفتاحية القابلة للضغط
  getKeywords(article: any): string[] {
    return this.parseJson(article?.keywordsJson);
  }

  // بيتحقق لو اللينك ده فيديو (mp4/webm/mov) عشان نعرضه بـ <video> بدل <img> في بانرات الإعلانات
  isVideo(url: string): boolean {
    if (!url) return false;
    return /\.(mp4|webm|mov)(\?.*)?$/i.test(url);
  }

  // نفس منطق generateSlug بتاع باقي الصفحات (بلوج/لانش)
  generateSlug(text: string): string {
    if (!text) return '';
    return text
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  // بيبني لينك المقال بالعنوان بدل الاعتماد على الـ id لوحده (زي /blogs/12/article-title)
  getArticleLink(article: any, origin: string = window.location.origin): string {
    const slug = this.generateSlug(article?.title);
    return slug ? `${origin}/blogs/${article.id}/${slug}` : `${origin}/blogs/${article.id}`;
  }
}