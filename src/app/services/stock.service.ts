import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { Product } from '../models/product.model';
import { Transaction } from '../models/transaction.model';

@Injectable({ providedIn: 'root' })
export class StockService {
  private platformId = inject(PLATFORM_ID);
  private readonly PRODUCTS_KEY = 'bss_products';
  private readonly TRANSACTIONS_KEY = 'bss_transactions';

  private products$ = new BehaviorSubject<Product[]>(this.loadProducts());
  private transactions$ = new BehaviorSubject<Transaction[]>(this.loadTransactions());

  get products() {
    return this.products$.asObservable();
  }

  get transactions() {
    return this.transactions$.asObservable();
  }

  get productsSnapshot(): Product[] {
    return this.products$.getValue();
  }

  private isBrowser(): boolean {
    return isPlatformBrowser(this.platformId);
  }

  private loadProducts(): Product[] {
    if (!this.isBrowser()) return [];
    return JSON.parse(localStorage.getItem(this.PRODUCTS_KEY) ?? '[]');
  }

  private loadTransactions(): Transaction[] {
    if (!this.isBrowser()) return [];
    return JSON.parse(localStorage.getItem(this.TRANSACTIONS_KEY) ?? '[]');
  }

  private saveProducts(products: Product[]): void {
    if (this.isBrowser()) {
      localStorage.setItem(this.PRODUCTS_KEY, JSON.stringify(products));
    }
    this.products$.next(products);
  }

  private saveTransactions(transactions: Transaction[]): void {
    if (this.isBrowser()) {
      localStorage.setItem(this.TRANSACTIONS_KEY, JSON.stringify(transactions));
    }
    this.transactions$.next(transactions);
  }

  addProduct(data: Omit<Product, 'id' | 'createdAt'>): void {
    const products = [...this.products$.getValue()];
    products.push({ ...data, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
    this.saveProducts(products);
  }

  updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): void {
    const products = this.products$.getValue().map((p) =>
      p.id === id ? { ...p, ...updates } : p
    );
    this.saveProducts(products);
  }

  deleteProduct(id: string): void {
    this.saveProducts(this.products$.getValue().filter((p) => p.id !== id));
  }

  adjustStock(
    productId: string,
    type: 'in' | 'out',
    quantity: number,
    note: string,
    purchaseCost?: number
  ): boolean {
    const products = this.products$.getValue();
    const product = products.find((p) => p.id === productId);
    if (!product) return false;

    const stockBefore = product.quantity;
    const stockAfter = type === 'in' ? stockBefore + quantity : stockBefore - quantity;
    if (stockAfter < 0) return false;

    const costBefore = product.cost;
    let costAfter = costBefore;

    // Recalculate weighted average cost on stock in
    if (type === 'in' && purchaseCost !== undefined && purchaseCost >= 0) {
      costAfter =
        stockAfter > 0
          ? Math.round(((stockBefore * costBefore + quantity * purchaseCost) / stockAfter) * 100) / 100
          : purchaseCost;
    }

    this.updateProduct(productId, { quantity: stockAfter, cost: costAfter });

    const transaction: Transaction = {
      id: crypto.randomUUID(),
      productId,
      productName: product.name,
      type,
      quantity,
      note,
      date: new Date().toISOString(),
      stockBefore,
      stockAfter,
      purchaseCost: type === 'in' ? purchaseCost : undefined,
      costBefore,
      costAfter,
      sellPrice: product.price,
    };
    this.saveTransactions([transaction, ...this.transactions$.getValue()]);
    return true;
  }
}
