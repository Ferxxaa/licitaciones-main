import { Pipe, PipeTransform } from '@angular/core';
import { Hitos } from './add-hito.component';

@Pipe({
  name: 'eliminaActivos',
  standalone: true
})
export class EliminaActivosPipe implements PipeTransform {

  transform(value: any, args?: Hitos[]): any {
    if (value && args) {
      let hitosDisponibles = value;
      // console.log("Hitos disponibles", value);
      // console.log("Hitos activos", args);
      args.forEach(hitosActivos => {
        hitosDisponibles = hitosDisponibles.filter(el => el.IdHito != hitosActivos.IdHito)
      });
      return hitosDisponibles;
    }
    return null;
  }

}
