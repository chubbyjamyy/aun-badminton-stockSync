import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { StockService } from '../../services/stock.service';
import { Product } from '../../models/product.model';

@Component({
  selector: 'app-stock-out',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './stock-out.component.html',
  styleUrl: './stock-out.component.css',
})
export class StockOutComponent implements OnInit, OnDestroy {
  private stockService = inject(StockService);
  private fb = inject(FormBuilder);
  private sub = new Subscription();

  products: Product[] = [];
  searchText = '';

  showStockModal = false;
  stockProduct: Product | null = null;
  stockError = '';

  stockForm = this.fb.group({
    quantity: [1, [Validators.required, Validators.min(1)]],
    note: [''],
  });

  ngOnInit(): void {
    this.sub.add(this.stockService.products.subscribe((p) => (this.products = p)));
  }

  ngOnDestroy(): void {
    this.sub.unsubscribe();
  }

  get filteredProducts(): Product[] {
    return this.products.filter((p) =>
      p.name.toLowerCase().includes(this.searchText.toLowerCase())
    );
  }

  openStockOutModal(product: Product): void {
    this.stockProduct = product;
    this.stockError = '';
    this.stockForm.reset({ quantity: 1, note: '' });
    this.showStockModal = true;
  }

  async saveStockOut(): Promise<void> {
    if (this.stockForm.invalid) {
      this.stockForm.markAllAsTouched();
      return;
    }
    const v = this.stockForm.value;
    const success = await this.stockService.adjustStock(
      this.stockProduct!.id,
      'out',
      Number(v.quantity),
      v.note ?? ''
    );
    if (!success) {
      this.stockError = 'Cannot reduce stock below 0.';
      return;
    }
    this.stockProduct = this.stockService.productsSnapshot.find(
      (p) => p.id === this.stockProduct!.id
    ) ?? null;
    this.showStockModal = false;
  }
}
