import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { LoginComponent } from './login/login.component';
import { HomeComponent } from './home/home.component';
import { UserComponent } from './header/user/user.component';
import { HeaderComponent } from './header/header.component';
import { NavComponent } from './nav/nav.component';
import { MainComponent } from './main/main.component';
import { AreasComponent } from './Licitaciones/areas/areas.component';
import { MandantesComponent } from './Licitaciones/mandantes/mandantes.component';
import { EjecutivoComponent } from './Licitaciones/ejecutivo/ejecutivo.component';
import { HitosComponent } from './Licitaciones/hitos/hitos.component';
import { LicitacionesComponent } from './Licitaciones/licitaciones/licitaciones.component';
import { MisLicitacionesComponent } from './Licitaciones/mis-licitaciones/mis-licitaciones.component';
import { TablaLicitacionesComponent } from './Licitaciones/tabla-licitaciones/tabla-licitaciones.component';
import { CalendarioLicComponent } from './Licitaciones/calendario-lic/calendario-lic.component';
import { BitacoraComponent } from './Licitaciones/bitacora/bitacora.component';
import { ReportesComponent } from './Reportes/reportes/reportes.component';
import { HomeAdnComponent } from './home/home-adn/home-adn.component';

//Material
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MaterialModule } from './material';
import { EditBitacoraComponent } from './Licitaciones/bitacora/edit-bitacora/edit-bitacora.component';
import { RetFechaOfertaPipe } from './Licitaciones/mis-licitaciones/ret-fecha-oferta.pipe';
import { ListaBitacoraComponent } from './Licitaciones/tabla-licitaciones/lista-bitacora/lista-bitacora.component';
import { TareasLicComponent } from './Licitaciones/tabla-licitaciones/tareas-lic/tareas-lic.component';
import { ArrDistingPipe } from './Licitaciones/tabla-licitaciones/tareas-lic/arr-disting.pipe';
import { AddHitoComponent } from './Licitaciones/tabla-licitaciones/add-hito/add-hito.component';
import { EliminaActivosPipe } from './Licitaciones/tabla-licitaciones/add-hito/elimina-activos.pipe';

//Routes

import { routes } from './app.routes';


@NgModule({
// ...existing code...
			imports: [
				BrowserModule,
				HttpClientModule,
				FormsModule,
				RouterModule.forRoot(routes),
				BrowserAnimationsModule,
				MaterialModule,
				AppComponent,
				LoginComponent,
				HomeComponent,
				UserComponent,
				HeaderComponent,
				NavComponent,
				MainComponent,
				AreasComponent,
				MandantesComponent,
				EjecutivoComponent,
				HitosComponent,
				LicitacionesComponent,
				MisLicitacionesComponent,
				TablaLicitacionesComponent,
				CalendarioLicComponent,
				BitacoraComponent,
				ReportesComponent,
				HomeAdnComponent,
				EditBitacoraComponent,
				RetFechaOfertaPipe,
				ListaBitacoraComponent,
				TareasLicComponent,
				ArrDistingPipe,
				AddHitoComponent,
				EliminaActivosPipe
			],
		providers: []
	})
export class AppModule { }
