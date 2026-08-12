import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { ArticleService } from '../../Services/article.service';

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './article-list.html'
})
export class ArticleListComponent implements OnInit {
  articleService = inject(ArticleService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  articles = signal<any[]>([]);
  isLoading = signal(true);
  keywordFilter = signal<string>('');

  filteredArticles = computed(() => {
    const kw = this.keywordFilter().trim().toLowerCase();
    if (!kw) return this.articles();
    return this.articles().filter(a =>
      this.articleService.getKeywords(a).some((k: string) => k.toLowerCase() === kw)
    );
  });

  ngOnInit() {
    // لو جاي من صفحة تفاصيل مقال بعد الضغط على كلمة مفتاحية: /blogs?keyword=...
    this.route.queryParamMap.subscribe(params => {
      this.keywordFilter.set(params.get('keyword') || '');
    });

    this.articleService.getPublished().subscribe({
      next: (data) => { this.articles.set(data); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  goToArticle(article: any) {
    const slug = this.articleService.generateSlug(article.title);
    this.router.navigate(['/blogs', article.id, slug].filter(Boolean));
  }

  clearFilter() {
    this.router.navigate(['/blogs']);
  }
}