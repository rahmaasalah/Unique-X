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
  getImageUrl(filename: string): string { return `${this.base}/image/${filename}`; }

  deleteSliderImage(blogId: number, filename: string) {
    return this.http.delete(`${this.base}/${blogId}/slider-image/${filename}`);
  }

  parseJson(json: string | null | undefined): any[] {
    if (!json) return [];
    try { return JSON.parse(json); } catch { return []; }
  }

  getSliderImages(blog: any): string[] {
    if (!blog?.sliderImages) return [];
    return blog.sliderImages.split('|').filter((s: string) => s.trim());
  }
}