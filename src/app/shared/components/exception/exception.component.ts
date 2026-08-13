import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-exception',
  templateUrl: './exception.component.html',
  standalone: true,
  imports: [CommonModule, RouterLink],
})
export class ExceptionComponent implements OnInit, OnDestroy {
  code: string | null = null;
  private subscriptions = new Subscription();

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.subscriptions.add(
      this.route.paramMap.subscribe((params) => {
        this.code = params.get('code'); // ejemplo: '404' o '401'
      }),
    );
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
