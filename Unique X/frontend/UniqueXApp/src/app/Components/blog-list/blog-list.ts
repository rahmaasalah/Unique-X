import { Component, inject, signal, computed, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { BlogService } from '../../Services/blog.service';

@Component({
  selector: 'app-blog-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './blog-list.html'
})
export class BlogListComponent implements OnInit {
  blogService = inject(BlogService);
  private router = inject(Router);

  blogs = signal<any[]>([]);
  isLoading = signal(true);
  activeCategory = signal<string>('');

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
}