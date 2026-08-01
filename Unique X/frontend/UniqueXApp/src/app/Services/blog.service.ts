import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BlogService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/blogs`;

  getPublished()                        { return this.http.get<any[]>(this.base); }
  getAll()                              { return this.http.get<any[]>(`${this.base}/all`); }
  getById(id: number)                   { return this.http.get<any>(`${this.base}/${id}`); }
  create(fd: FormData)                  { return this.http.post<any>(this.base, fd); }
  update(id: number, fd: FormData)      { return this.http.put<any>(`${this.base}/${id}`, fd); }
  delete(id: number)                    { return this.http.delete(`${this.base}/${id}`); }
  reorder(orderedIds: number[])         { return this.http.put(`${this.base}/reorder`, orderedIds); }

  // دلوقتي الـ URLs بتيجي من Cloudinary مباشرة — مش محتاجين نبني URL
  getImageUrl(url: string): string {
    if (!url) return '';
    // لو URL كامل (Cloudinary) رجعه كما هو
    if (url.startsWith('http')) return url;
    // fallback لو لسه في قديم بـ filename
    return `${this.base}/image/${url}`;
  }

  deleteSliderImage(blogId: number, imageUrl: string) {
    return this.http.delete(`${this.base}/${blogId}/slider-image`, {
      body: imageUrl,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  parseJson(json: string | null | undefined): any[] {
    if (!json) return [];
    try { return JSON.parse(json); } catch { return []; }
  }

  getSliderImages(blog: any): string[] {
    if (!blog?.sliderImages) return [];
    return blog.sliderImages.split('|').filter((s: string) => s.trim());
  }

  // صورة الغلاف: لو الأدمن حدد main image بيرجعها، وإلا أول صورة في السلايدر
  getCoverImage(blog: any): string {
    if (blog?.coverImageUrl) return blog.coverImageUrl;
    const imgs = this.getSliderImages(blog);
    return imgs.length > 0 ? imgs[0] : '';
  }

  getResaleUnitIds(blog: any): number[] {
    return this.parseJson(blog?.resaleUnitIdsJson);
  }

  getPrimaryUnitIds(blog: any): number[] {
    return this.parseJson(blog?.primaryUnitIdsJson);
  }

  // نفس منطق generateSlug بتاع صفحة الوحدة: بنحول العنوان للينك إنجليزي نضيف
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

  // بيبني لينك البلوج بالعنوان بدل الاعتماد على الـ id لوحده (زي /blog/12/grand-view)
  getBlogLink(blog: any, origin: string = window.location.origin): string {
    const slug = this.generateSlug(blog?.title);
    return slug ? `${origin}/blog/${blog.id}/${slug}` : `${origin}/blog/${blog.id}`;
  }
}