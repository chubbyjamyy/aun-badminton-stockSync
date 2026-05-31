import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subscription } from 'rxjs';
import { StockService } from '../../services/stock.service';
import { Product } from '../../models/product.model';
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css',
})
export class DashboardComponent implements OnInit, OnDestroy {
  private stockService = inject(StockService);
  private sub = new Subscription();

  products: Product[] = [];
  transactions: Transaction[] = [];

  ngOnInit(): void {
    this.sub.add(this.stockService.products.subscribe((p) => (this.products = p)));
    this.sub.add(this.stockService.transactions.subscribe((t) => (this.transactions = t)));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get totalProducts(): number {
    return this.products.length;
  }

  get lowStockProducts(): Product[] {
    return this.products.filter((p) => p.quantity > 0 && p.quantity <= p.minStock);
  }

  get outOfStockProducts(): Product[] {
    return this.products.filter((p) => p.quantity === 0);
  }

  get totalStockValue(): number {
    return this.products.reduce((sum, p) => sum + p.price * p.quantity, 0);
  }

  get recentTransactions(): Transaction[] {
    return this.transactions.slice(0, 8);
  }
}
