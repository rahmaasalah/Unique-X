import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ArticleService } from '../../Services/article.service';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './article-detail.html'
})
export class ArticleDetailComponent implements OnInit {
  articleService = inject(ArticleService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);

  article = signal<any>(null);
  isLoading = signal(true);
  relatedArticles = signal<any[]>([]);
  linkCopied = signal(false);

  sections = computed(() => this.articleService.getSections(this.article()));
  keywords = computed(() => this.articleService.getKeywords(this.article()));

  ngOnInit() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.articleService.getById(id).subscribe({
      next: (data) => {
        this.article.set(data);
        this.isLoading.set(false);

        // تحديث اللينك في المتصفح ليشمل عنوان المقال بدل الاعتماد على الـ id لوحده
        const slug = this.articleService.generateSlug(data.title);
        const newPath = slug ? `/blogs/${data.id}/${slug}` : `/blogs/${data.id}`;
        this.location.replaceState(newPath);

        this.loadRelated(id);
      },
      error: () => this.isLoading.set(false)
    });
  }

  loadRelated(id: number) {
    this.articleService.getRelated(id, 4).subscribe({
      next: (data) => this.relatedArticles.set(data),
      error: () => {}
    });
  }

  goToArticle(article: any) {
    const slug = this.articleService.generateSlug(article.title);
    this.router.navigate(['/blogs', article.id, slug].filter(Boolean)).then(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // إعادة تحميل الصفحة بمقال جديد
      this.ngOnInit();
    });
  }

  goToKeyword(keyword: string) {
    this.router.navigate(['/blogs'], { queryParams: { keyword } });
  }

  copyLink() {
    const link = this.articleService.getArticleLink(this.article());
    navigator.clipboard.writeText(link).then(() => {
      this.linkCopied.set(true);
      setTimeout(() => this.linkCopied.set(false), 2000);
    });
  }

  // ===== روابط المشاركة على السوشيال ميديا =====
  getShareLink(platform: 'facebook' | 'whatsapp' | 'x'): string {
    const link = encodeURIComponent(this.articleService.getArticleLink(this.article()));
    const title = encodeURIComponent(this.article()?.title || '');

    switch (platform) {
      case 'facebook':
        return `https://www.facebook.com/sharer/sharer.php?u=${link}`;
      case 'whatsapp':
        return `https://wa.me/?text=${title}%20${link}`;
      case 'x':
        return `https://twitter.com/intent/tweet?text=${title}&url=${link}`;
      default:
        return '#';
    }
  }

  openShare(platform: 'facebook' | 'whatsapp' | 'x', event: Event) {
    event.stopPropagation();
    window.open(this.getShareLink(platform), '_blank');
  }

  goBack() {
    this.router.navigate(['/blogs']);
  }
}