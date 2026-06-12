import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./components/dashboard/dashboard.component').then(
        (m) => m.DashboardComponent
      ),
  },
  {
    path: 'products',
    loadComponent: () =>
      import('./components/products/products.component').then(
        (m) => m.ProductsComponent
      ),
  },
  {
    path: 'stock-out',
    loadComponent: () =>
      import('./components/stock-out/stock-out.component').then(
        (m) => m.StockOutComponent
      ),
  },
  {
    path: 'transactions',
    loadComponent: () =>
      import('./components/transactions/transactions.component').then(
        (m) => m.TransactionsComponent
      ),
  },
  { path: '**', redirectTo: '' },
];
