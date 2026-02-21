import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../Services/auth';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-find-agent',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './find-agent.html',
  styleUrl: './find-agent.css'
})
export class FindAgentComponent implements OnInit {
  authService = inject(AuthService);
  
  brokers = signal<any[]>([]);
  searchTerm = signal('');
  isLoading = signal(true);

  // فلترة البروكرز بالاسم لحظياً
  filteredBrokers = computed(() => {
    return this.brokers().filter(b => 
      b.fullName.toLowerCase().includes(this.searchTerm().toLowerCase())
    );
  });

  ngOnInit(): void {
    this.authService.getBrokers().subscribe({
      next: (data) => {
        this.brokers.set(data);
        this.isLoading.set(false);
      }
    });
  }
}