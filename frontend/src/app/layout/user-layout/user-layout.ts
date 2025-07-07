import { RouterModule } from '@angular/router';
import { Component } from '@angular/core';
import { HeaderComponent } from '../header/header';
import { FooterComponent } from '../footer/footer';

@Component({
  selector: 'app-user-layout',
  templateUrl: './user-layout.html',
  styleUrl: './user-layout.scss',
  imports: [RouterModule, HeaderComponent, FooterComponent],
})
export class UserLayoutComponent {}
