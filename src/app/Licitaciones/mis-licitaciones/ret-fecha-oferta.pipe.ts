import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'retFechaOferta'
})
export class RetFechaOfertaPipe implements PipeTransform {

  transform(value: any, args?: any): any {
    if (!value)
      return null
    console.log(value);
    return null;
  }

}
