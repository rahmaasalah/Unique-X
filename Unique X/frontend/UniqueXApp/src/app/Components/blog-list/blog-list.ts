import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BlogService } from '../../Services/blog.service';
import { CurrencyService } from '../../Services/currency.service';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './blog-list.html'
})
export class BlogListComponent implements OnInit {
  blogService = inject(BlogService);
  currencyService = inject(CurrencyService);
  private router = inject(Router);

  blogs = signal<any[]>([]);
  isLoading = signal(true);
  activeCategory = signal<string>('');

  // رقم الأدمن ثابت في السيستم (نفس الرقم المستخدم في صفحة التفاصيل)
  private readonly ADMIN_PHONE = '01509064020';

  categories = computed(() => {
    const cats = this.blogs().map(b => b.category).filter((c): c is string => !!c);
    return [...new Set(cats)];
  });

  filteredBlogs = computed(() => {
    const cat = this.activeCategory();
    if (!cat) return this.blogs();
    return this.blogs().filter(b => b.category === cat);
  });

  ngOnInit() {
    this.blogService.getPublished().subscribe({
      next: (data) => { this.blogs.set(data); this.isLoading.set(false); },
      error: () => this.isLoading.set(false)
    });
  }

  goToBlog(id: number) {
    this.router.navigate(['/blog', id]);
  }

  getFirstImage(blog: any): string {
    return this.blogService.getCoverImage(blog);
  }

  // Download button → بيفتح واتساب الأدمن باستفسار عن المشروع + لينكه (اللينك نفسه بيعمل بريفيو تلقائي)
  sendInquiry(blog: any, event: Event): void {
    event.stopPropagation(); // منع فتح صفحة البلوج لما يدوس على الزرار

    const cleaned = '20' + this.ADMIN_PHONE.replace(/^0+/, '');
    const blogLink = this.blogService.getBlogLink(blog);

    const msg = encodeURIComponent(
      `Interested in project: ${blog.title}\n${blogLink}`
    );

    window.open(`https://wa.me/${cleaned}?text=${msg}`, '_blank');
  }
}