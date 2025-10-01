import { Component } from "@angular/core";
import { ActivatedRoute, RouterLink } from "@angular/router";
import { CommonModule } from "@angular/common";

@Component({
  selector: "app-exception",
  templateUrl: "./exception.component.html",
  standalone: true,
  imports: [CommonModule, RouterLink
  ],
})
export class ExceptionComponent {
  code: string | null = null;

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    // Recupera el parámetro desde la ruta
    this.route.paramMap.subscribe((params) => {
      this.code = params.get("code"); // ejemplo: '404' o '401'
    });
  }
}
