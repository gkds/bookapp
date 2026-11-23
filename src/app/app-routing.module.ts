import { AdminGuard } from './auth/admin.guard';
import { AuthGuard } from './auth/auth.guard';
import { CategoriesComponent } from './categories/categories.component';
import { CheckoutComponent } from './checkout/checkout.component';
import { InventoryComponent } from './inventory/inventory.component';
import { RegisterComponent } from './auth/register/register.component';
import { CartComponent } from './cart/cart.component';
import { BookcatalogComponent } from './bookcatalog/bookcatalog.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';
import { OrderConfirmationComponent } from './order-confirmation/order-confirmation.component';
import { OrdersComponent } from './orders/orders.component';


const routes: Routes = [
  { path:'', component: BookcatalogComponent},
  { path:'cart', component: CartComponent, canActivate:[AuthGuard]},
  { path:'checkout', component: CheckoutComponent, canActivate:[AuthGuard]},
  { path:'admin/inventory', component: InventoryComponent, canActivate:[AdminGuard]},
  { path:'admin/categories', component: CategoriesComponent, canActivate:[AdminGuard]},
  { path:'order-confirmation/:id', component: OrderConfirmationComponent, canActivate:[AuthGuard], data: { justPlaced: true }},
  { path:'orders', component: OrdersComponent, canActivate:[AuthGuard]},
  { path:'orders/:id', component: OrderConfirmationComponent, canActivate:[AuthGuard]},
  { path:'login', component: LoginComponent},
  { path:'register', component: RegisterComponent},
  { path:'**', redirectTo: ''},
];

@NgModule({
  imports: [RouterModule.forRoot(routes, { scrollPositionRestoration: 'top' })],
  exports: [RouterModule]
})
export class AppRoutingModule { }
