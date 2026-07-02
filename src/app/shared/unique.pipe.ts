import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'unique',
  standalone: true
})
export class UniquePipe implements PipeTransform {
  transform(items: any[], field: string): any[] {
    if (!Array.isArray(items)) return [];
    const seen = new Set();
    return items.filter(item => {
      const val = item[field];
      if (val == null || seen.has(val)) return false;
      seen.add(val);
      return true;
    });
  }
}
