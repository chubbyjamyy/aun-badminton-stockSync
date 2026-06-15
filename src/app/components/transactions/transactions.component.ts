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
