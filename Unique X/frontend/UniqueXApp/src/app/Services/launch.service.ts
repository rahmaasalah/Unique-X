import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class LaunchService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/launches`;

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

  deleteSliderImage(launchId: number, imageUrl: string) {
    return this.http.delete(`${this.base}/${launchId}/slider-image`, {
      body: JSON.stringify(imageUrl),
      headers: { 'Content-Type': 'application/json' }
    });
  }

  reorderSliderImages(launchId: number, orderedImageUrls: string[]) {
    return this.http.put(`${this.base}/${launchId}/reorder-slider-images`, orderedImageUrls);
  }

  parseJson(json: string | null | undefined): any[] {
    if (!json) return [];
    try { return JSON.parse(json); } catch { return []; }
  }

  getSliderImages(launch: any): string[] {
    if (!launch?.sliderImages) return [];
    return launch.sliderImages.split('|').filter((s: string) => s.trim());
  }

  // صورة الغلاف: لو الأدمن حدد main image بيرجعها، وإلا أول صورة في السلايدر
  getCoverImage(launch: any): string {
    if (launch?.coverImageUrl) return launch.coverImageUrl;
    const imgs = this.getSliderImages(launch);
    return imgs.length > 0 ? imgs[0] : '';
  }

  getResaleUnitIds(launch: any): number[] {
    return this.parseJson(launch?.resaleUnitIdsJson);
  }

  getPrimaryUnitIds(launch: any): number[] {
    return this.parseJson(launch?.primaryUnitIdsJson);
  }

  // 🟢 بيرجع نص "Delivery in {year}" من تاريخ التسليم اللي الأدمن حدده
  getDeliveryLabel(launch: any): string {
    if (!launch?.deliveryDate) return '';
    const year = new Date(launch.deliveryDate).getFullYear();
    if (isNaN(year)) return '';
    return `Delivery in ${year}`;
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

  // بيبني لينك اللونش بالعنوان بدل الاعتماد على الـ id لوحده (زي /launch/12/grand-view)
  getLaunchLink(launch: any, origin: string = window.location.origin): string {
    const slug = this.generateSlug(launch?.title);
    return slug ? `${origin}/launch/${launch.id}/${slug}` : `${origin}/launch/${launch.id}`;
  }
}