import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { BehaviorSubject } from 'rxjs';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Product } from '../models/product.model';
import { Transaction } from '../models/transaction.model';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class StockService {
  private platformId = inject(PLATFORM_ID);
  private supabase!: SupabaseClient;

  private products$ = new BehaviorSubject<Product[]>([]);
  private transactions$ = new BehaviorSubject<Transaction[]>([]);

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
      this.loadAll();
    }
  }

  get products() {
    return this.products$.asObservable();
  }

  get transactions() {
    return this.transactions$.asObservable();
  }

  get productsSnapshot(): Product[] {
    return this.products$.getValue();
  }

  private async loadAll(): Promise<void> {
    const [{ data: products }, { data: transactions }] = await Promise.all([
      this.supabase.from('products').select('*').order('created_at'),
      this.supabase.from('transactions').select('*').order('date', { ascending: false }),
    ]);
    this.products$.next((products ?? []).map(this.toProduct));
    this.transactions$.next((transactions ?? []).map(this.toTransaction));
  }

  private toProduct(row: Record<string, unknown>): Product {
    return {
      id: row['id'] as string,
      name: row['name'] as string,
      category: row['category'] as string,
      unit: row['unit'] as string,
      quantity: Number(row['quantity']),
      minStock: Number(row['min_stock']),
      price: Number(row['price']),
      cost: Number(row['cost']),
      colorName: row['color_name'] as string | undefined,
      colorHex: row['color_hex'] as string | undefined,
      createdAt: row['created_at'] as string,
    };
  }

  private toTransaction(row: Record<string, unknown>): Transaction {
    return {
      id: row['id'] as string,
      productId: row['product_id'] as string,
      productName: row['product_name'] as string,
      type: row['type'] as 'in' | 'out',
      quantity: Number(row['quantity']),
      note: (row['note'] as string) ?? '',
      date: row['date'] as string,
      stockBefore: Number(row['stock_before']),
      stockAfter: Number(row['stock_after']),
      purchaseCost: row['purchase_cost'] != null ? Number(row['purchase_cost']) : undefined,
      costBefore: row['cost_before'] != null ? Number(row['cost_before']) : undefined,
      costAfter: row['cost_after'] != null ? Number(row['cost_after']) : undefined,
      sellPrice: row['sell_price'] != null ? Number(row['sell_price']) : undefined,
    };
  }

  async addProduct(data: Omit<Product, 'id' | 'createdAt'>): Promise<void> {
    if (!this.supabase) return;
    const { data: row, error } = await this.supabase
      .from('products')
      .insert({
        name: data.name,
        category: data.category,
        unit: data.unit,
        quantity: data.quantity,
        min_stock: data.minStock,
        price: data.price,
        cost: data.cost,
        color_name: data.colorName,
        color_hex: data.colorHex,
      })
      .select()
      .single();
    if (error) throw error;
    this.products$.next([...this.products$.getValue(), this.toProduct(row)]);
  }

  async updateProduct(id: string, updates: Partial<Omit<Product, 'id' | 'createdAt'>>): Promise<void> {
    if (!this.supabase) return;
    const patch: Record<string, unknown> = {};
    if (updates.name !== undefined) patch['name'] = updates.name;
    if (updates.category !== undefined) patch['category'] = updates.category;
    if (updates.unit !== undefined) patch['unit'] = updates.unit;
    if (updates.quantity !== undefined) patch['quantity'] = updates.quantity;
    if (updates.minStock !== undefined) patch['min_stock'] = updates.minStock;
    if (updates.price !== undefined) patch['price'] = updates.price;
    if (updates.cost !== undefined) patch['cost'] = updates.cost;
    if (updates.colorName !== undefined) patch['color_name'] = updates.colorName;
    if (updates.colorHex !== undefined) patch['color_hex'] = updates.colorHex;

    const { data: row, error } = await this.supabase
      .from('products')
      .update(patch)
      .eq('id', id)
      .select()
      .single();
    if (error) throw error;
    this.products$.next(
      this.products$.getValue().map((p) => (p.id === id ? this.toProduct(row) : p))
    );
  }

  async deleteProduct(id: string): Promise<void> {
    if (!this.supabase) return;
    const { error } = await this.supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    this.products$.next(this.products$.getValue().filter((p) => p.id !== id));
  }

  async adjustStock(
    productId: string,
    type: 'in' | 'out',
    quantity: number,
    note: string,
    purchaseCost?: number,
    sellPriceOverride?: number
  ): Promise<boolean> {
    if (!this.supabase) return false;
    const product = this.products$.getValue().find((p) => p.id === productId);
    if (!product) return false;

    const stockBefore = product.quantity;
    const stockAfter = type === 'in' ? stockBefore + quantity : stockBefore - quantity;
    if (stockAfter < 0) return false;

    const costBefore = product.cost;
    let costAfter = costBefore;
    if (type === 'in' && purchaseCost !== undefined && purchaseCost >= 0) {
      costAfter =
        stockAfter > 0
          ? Math.round(((stockBefore * costBefore + quantity * purchaseCost) / stockAfter) * 100) / 100
          : purchaseCost;
    }

    await this.updateProduct(productId, { quantity: stockAfter, cost: costAfter });

    const { data: txRow, error } = await this.supabase
      .from('transactions')
      .insert({
        product_id: productId,
        product_name: product.name,
        type,
        quantity,
        note,
        date: new Date().toISOString(),
        stock_before: stockBefore,
        stock_after: stockAfter,
        purchase_cost: type === 'in' ? (purchaseCost ?? null) : null,
        cost_before: costBefore,
        cost_after: costAfter,
        sell_price: sellPriceOverride ?? product.price,
      })
      .select()
      .single();
    if (error) throw error;

    this.transactions$.next([this.toTransaction(txRow), ...this.transactions$.getValue()]);
    return true;
  }
}
