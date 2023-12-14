import { AuthGuard } from './auth/auth.guard';
import { RegisterComponent } from './auth/register/register.component';
import { CartComponent } from './cart/cart.component';
import { BookcatalogComponent } from './bookcatalog/bookcatalog.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { LoginComponent } from './auth/login/login.component';


const routes: Routes = [
  { path:'', component: BookcatalogComponent},
  { path:'cart', component: CartComponent, canActivate:[AuthGuard]},
  { path:'login', component: LoginComponent},
  { path:'register', component: RegisterComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
