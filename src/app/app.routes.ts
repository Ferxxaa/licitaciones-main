import { Routes } from '@angular/router';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { AreasComponent } from './Licitaciones/areas/areas.component';
import { MandantesComponent } from './Licitaciones/mandantes/mandantes.component';
import { EjecutivoComponent } from './Licitaciones/ejecutivo/ejecutivo.component';
import { HitosComponent } from './Licitaciones/hitos/hitos.component';
import { CalendarioLicComponent } from './Licitaciones/calendario-lic/calendario-lic.component';
import { BitacoraComponent } from './Licitaciones/bitacora/bitacora.component';
import { ReportesComponent } from './Reportes/reportes/reportes.component';
import { LicitacionesComponent } from './Licitaciones/licitaciones/licitaciones.component';
import { MisLicitacionesComponent } from './Licitaciones/mis-licitaciones/mis-licitaciones.component';
import { TablaLicitacionesComponent } from './Licitaciones/tabla-licitaciones/tabla-licitaciones.component';
import { EditarLicitacionesComponent } from './Licitaciones/editar-licitaciones/editar-licitaciones.component';

export const routes: Routes = [
      {
        path: '',
        redirectTo: '/Login',
        pathMatch: 'full'
      },
      {
        path: 'Login',
        component: LoginComponent
      },
      {
        path: 'Home',
        component: HomeComponent
      },
      {
        path: 'Ver-Tareas',
        component: HomeComponent // Puedes cambiarlo por el componente correcto si lo tienes
      },
      {
        path: 'Licitacion-Areas',
        component: AreasComponent
      },
      {
        path: 'Licitacion-Mandantes',
        component: MandantesComponent
      },
      {
        path: 'Licitacion-Ejecutivos',
        component: EjecutivoComponent
      },
      {
        path: 'Licitacion-Hitos',
        component: HitosComponent
      },
      {
        path: 'Licitacion-CalendarioLic',
        component: CalendarioLicComponent
      },
      {
        path: 'Licitacion-Bitacora',
        component: BitacoraComponent
      },
      {
        path: 'Reporte-Licitaciones',
        component: ReportesComponent
      },
      {
        path: 'Licitacion-Agregar',
        component: LicitacionesComponent
      },
      {
        path: 'Licitacion-MisLicitaciones',
        component: MisLicitacionesComponent
      },
      {
        path: 'Licitacion-Detalle',
        component: TablaLicitacionesComponent
      },
      {
        path: 'Editar-Licitaciones',
        component: EditarLicitacionesComponent
      }
    ];
