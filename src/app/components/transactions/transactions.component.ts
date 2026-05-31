import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { StockService } from '../../services/stock.service';
import { Transaction } from '../../models/transaction.model';

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './transactions.component.html',
  styleUrl: './transactions.component.css',
})
export class TransactionsComponent implements OnInit, OnDestroy {
  private stockService = inject(StockService);
  private sub = new Subscription();

  transactions: Transaction[] = [];
  filterType: 'all' | 'in' | 'out' = 'all';
  searchText = '';

  ngOnInit(): void {
    this.sub.add(this.stockService.transactions.subscribe((t) => (this.transactions = t)));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get filteredTransactions(): Transaction[] {
    return this.transactions.filter((t) => {
      const matchType = this.filterType === 'all' || t.type === this.filterType;
      const matchSearch =
        t.productName.toLowerCase().includes(this.searchText.toLowerCase()) ||
        t.note.toLowerCase().includes(this.searchText.toLowerCase());
      return matchType && matchSearch;
    });
  }

  get totalIn(): number {
    return this.transactions
      .filter((t) => t.type === 'in')
      .reduce((s, t) => s + t.quantity, 0);
  }

  get totalOut(): number {
    return this.transactions
      .filter((t) => t.type === 'out')
      .reduce((s, t) => s + t.quantity, 0);
  }
}
