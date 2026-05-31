import { Component, inject, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { StockService } from '../../services/stock.service';
import { Product, CATEGORIES, UNITS } from '../../models/product.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './products.component.html',
  styleUrl: './products.component.css',
})
export class ProductsComponent implements OnInit, OnDestroy {
  private stockService = inject(StockService);
  private fb = inject(FormBuilder);
  private sub = new Subscription();

  products: Product[] = [];
  categories = CATEGORIES;
  units = UNITS;

  searchText = '';
  filterCategory = '';

  showProductModal = false;
  editingProduct: Product | null = null;

  showStockModal = false;
  stockProduct: Product | null = null;
  stockError = '';

  productForm = this.fb.group({
    name: ['', Validators.required],
    category: ['', Validators.required],
    unit: ['piece', Validators.required],
    quantity: [0, [Validators.required, Validators.min(0)]],
    minStock: [5, [Validators.required, Validators.min(0)]],
    price: [0, [Validators.required, Validators.min(0)]],
    cost: [0, [Validators.required, Validators.min(0)]],
    colorName: ['',[Validators.required, Validators.min(0)]],
    colorHex: ['#000000'],
  });

  stockForm = this.fb.group({
    type: ['in', Validators.required],
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
    return this.products.filter((p) => {
      const matchSearch = p.name.toLowerCase().includes(this.searchText.toLowerCase());
      const matchCat = !this.filterCategory || p.category === this.filterCategory;
      return matchSearch && matchCat;
    });
  }

  openAddModal(): void {
    this.editingProduct = null;
    this.productForm.reset({ unit: 'piece', quantity: 0, minStock: 5, price: 0, cost: 0, colorName: '', colorHex: '#000000' });
    this.showProductModal = true;
  }

  openEditModal(product: Product): void {
    this.editingProduct = product;
    this.productForm.patchValue({
      name: product.name,
      category: product.category,
      unit: product.unit,
      quantity: product.quantity,
      minStock: product.minStock,
      price: product.price,
      cost: product.cost ?? 0,
      colorName: product.colorName ?? '',
      colorHex: product.colorHex ?? '#000000',
    });
    this.showProductModal = true;
  }

  saveProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }
    const v = this.productForm.value;
    const data = {
      name: v.name!,
      category: v.category!,
      unit: v.unit!,
      quantity: Number(v.quantity),
      minStock: Number(v.minStock),
      price: Number(v.price),
      cost: Number(v.cost),
      colorName: v.colorName ?? '',
      colorHex: v.colorHex ?? '',
    };
    if (this.editingProduct) {
      this.stockService.updateProduct(this.editingProduct.id, data);
    } else {
      this.stockService.addProduct(data);
    }
    this.showProductModal = false;
  }

  deleteProduct(product: Product): void {
    if (confirm(`Delete "${product.name}"? This action cannot be undone.`)) {
      this.stockService.deleteProduct(product.id);
    }
  }

  openStockModal(product: Product): void {
    this.stockProduct = product;
    this.stockError = '';
    this.stockForm.reset({ type: 'in', quantity: 1, note: '' });
    this.showStockModal = true;
  }

  saveStock(): void {
    if (this.stockForm.invalid) {
      this.stockForm.markAllAsTouched();
      return;
    }
    const v = this.stockForm.value;
    const success = this.stockService.adjustStock(
      this.stockProduct!.id,
      v.type as 'in' | 'out',
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
