import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { StockService } from '../../services/stock.service';
import { Transaction } from '../../models/transaction.model';
import { Product } from '../../models/product.model';

const KNOTS_PRICE = 20;
const GROMMET_PRICE = 5;

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
  products: Product[] = [];
  filterType: 'all' | 'in' | 'out' = 'all';
  searchText = '';
  activeTab: 'history' | 'profit' = 'history';

  deletingId: string | null = null;
  editingTxn: Transaction | null = null;
  editProductId = '';
  editNote = '';
  editSellPrice: number | null = null;
  editPurchaseCost: number | null = null;
  editDate = '';
  editKnots = false;
  editGrommets = 0;
  saving = false;

  ngOnInit(): void {
    this.sub.add(this.stockService.transactions.subscribe((t) => (this.transactions = t)));
    this.sub.add(this.stockService.products.subscribe((p) => (this.products = p)));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  private txnProfit(t: Transaction): number {
    if (t.type !== 'out' || t.sellPrice == null || t.costBefore == null) return 0;
    return (t.sellPrice - t.costBefore) * t.quantity;
  }

  get profitToday(): number {
    const today = new Date().toDateString();
    return this.transactions
      .filter((t) => new Date(t.date).toDateString() === today)
      .reduce((s, t) => s + this.txnProfit(t), 0);
  }

  get profitThisMonth(): number {
    const now = new Date();
    return this.transactions
      .filter((t) => {
        const d = new Date(t.date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      })
      .reduce((s, t) => s + this.txnProfit(t), 0);
  }

  get profitAllTime(): number {
    return this.transactions.reduce((s, t) => s + this.txnProfit(t), 0);
  }

  get dailyProfitRows(): { date: string; revenue: number; cost: number; profit: number }[] {
    const map = new Map<string, { revenue: number; cost: number }>();
    for (const t of this.transactions) {
      if (t.type !== 'out') continue;
      const key = new Date(t.date).toLocaleDateString('en-GB');
      const entry = map.get(key) ?? { revenue: 0, cost: 0 };
      entry.revenue += (t.sellPrice ?? 0) * t.quantity;
      entry.cost += (t.costBefore ?? 0) * t.quantity;
      map.set(key, entry);
    }
    return Array.from(map.entries())
      .map(([date, v]) => ({ date, revenue: v.revenue, cost: v.cost, profit: v.revenue - v.cost }))
      .sort((a, b) => {
        const parse = (s: string) => s.split('/').reverse().join('-');
        return parse(b.date).localeCompare(parse(a.date));
      });
  }

  get monthlyProfitRows(): { month: string; revenue: number; cost: number; profit: number }[] {
    const map = new Map<string, { revenue: number; cost: number }>();
    for (const t of this.transactions) {
      if (t.type !== 'out') continue;
      const d = new Date(t.date);
      const key = d.toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
      const entry = map.get(key) ?? { revenue: 0, cost: 0 };
      entry.revenue += (t.sellPrice ?? 0) * t.quantity;
      entry.cost += (t.costBefore ?? 0) * t.quantity;
      map.set(key, entry);
    }
    return Array.from(map.entries())
      .map(([month, v]) => ({ month, revenue: v.revenue, cost: v.cost, profit: v.revenue - v.cost }))
      .sort((a, b) => {
        const parse = (s: string) => {
          const [m, y] = s.split(' ');
          const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
          return new Date(+y, months[m]).getTime();
        };
        return parse(b.month) - parse(a.month);
      });
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

  async confirmDelete(id: string): Promise<void> {
    this.deletingId = id;
  }

  cancelDelete(): void {
    this.deletingId = null;
  }

  async doDelete(): Promise<void> {
    if (!this.deletingId) return;
    await this.stockService.deleteTransaction(this.deletingId);
    this.deletingId = null;
  }

  get editSelectedProduct(): Product | undefined {
    return this.products.find((p) => p.id === this.editProductId);
  }

  get editOptionsExtra(): number {
    if (!this.editingTxn || this.editingTxn.type !== 'out') return 0;
    return (this.editKnots ? KNOTS_PRICE : 0) + (this.editGrommets || 0) * GROMMET_PRICE;
  }

  get editEffectiveSellPrice(): number {
    return (this.editSelectedProduct?.price ?? this.editSellPrice ?? 0) + this.editOptionsExtra;
  }

  openEdit(txn: Transaction): void {
    this.editingTxn = txn;
    this.editProductId = txn.productId;
    this.editNote = txn.note ?? '';
    this.editPurchaseCost = txn.purchaseCost ?? null;
    this.editDate = txn.date ? txn.date.slice(0, 16) : '';
    this.editKnots = false;
    this.editGrommets = 0;
    // reverse-engineer knots/grommets from sell price vs base price
    const product = this.products.find((p) => p.id === txn.productId);
    if (product && txn.sellPrice != null) {
      const extra = txn.sellPrice - product.price;
      if (extra > 0) {
        this.editKnots = extra >= KNOTS_PRICE;
        const remaining = this.editKnots ? extra - KNOTS_PRICE : extra;
        this.editGrommets = remaining > 0 ? Math.round(remaining / GROMMET_PRICE) : 0;
      }
    }
    this.editSellPrice = txn.sellPrice ?? null;
  }

  closeEdit(): void {
    this.editingTxn = null;
  }

  async saveEdit(): Promise<void> {
    if (!this.editingTxn || this.saving) return;
    this.saving = true;
    const selectedProduct = this.editSelectedProduct;
    const finalSellPrice = this.editingTxn.type === 'out'
      ? (selectedProduct ? this.editEffectiveSellPrice : this.editSellPrice)
      : this.editSellPrice;
    try {
      await this.stockService.updateTransaction(this.editingTxn.id, {
        note: this.editNote,
        sellPrice: finalSellPrice,
        purchaseCost: this.editPurchaseCost,
        date: this.editDate ? new Date(this.editDate).toISOString() : undefined,
        productId: this.editProductId,
        productName: selectedProduct?.name ?? this.editingTxn.productName,
      });
      this.closeEdit();
    } finally {
      this.saving = false;
    }
  }
}
