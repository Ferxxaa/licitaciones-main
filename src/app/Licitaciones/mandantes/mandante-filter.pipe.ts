import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'mandanteFilter',
  standalone: true
})
export class MandanteFilterPipe implements PipeTransform {
  transform(items: any[], search: string): any[] {
    if (!items) return [];
    if (!search || search.trim() === '') return items;
    const lowerSearch = search.toLowerCase();
    return items.filter(item =>
      item.NombreMandante && item.NombreMandante.toLowerCase().includes(lowerSearch)
    );
  }
}
