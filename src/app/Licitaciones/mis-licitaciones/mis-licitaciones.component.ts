// ...existing code...
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { OfertaEconomicaService } from '../../servicios/oferta-economica.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainComponent } from '../../main/main.component';

declare var jQuery: any;
declare var $: any;

// Clases necesarias
class Areas {
  IdArea: number = 0;
  NombreArea: string = '';
}

class Mandante {
  IdMandante: number = 0;
  NombreMandante: string = '';
}

class Ejecutivos {
  IdEjecutivos: number = 0;
  NombreEjecutivo: string = '';
  IdMandante: number = 0;
}

@Component({
  selector: 'app-mis-licitaciones',
  standalone: true,
  imports: [CommonModule, FormsModule, MainComponent],
  templateUrl: './mis-licitaciones.component.html',
  styleUrls: ['./mis-licitaciones.component.css'],
  providers: [OfertaEconomicaService]
})
export class MisLicitacionesComponent implements OnInit {
  // Abre el detalle de una licitación hija por su IdLicitacion
  DetallePorId(id: number) {
    // Buscar en licitaciones principales
    let lic = this.Licitaciones.find(l => l.IdLicitacion === id);
    
    // Si no se encuentra, buscar en licitaciones hijas de contratos marco
    if (!lic) {
      for (const contrato of this.Licitaciones) {
        if (contrato.EsContratoMarco && contrato.licitaciones && Array.isArray(contrato.licitaciones)) {
          const hija = contrato.licitaciones.find(h => h.IdLicitacion === id);
          if (hija) {
            lic = hija;
            break;
          }
        }
      }
    }
    
    // Si aún no se encuentra, buscar en allLicitaciones
    if (!lic) {
      lic = this.allLicitaciones?.find(l => l.IdLicitacion === id);
    }
    
    // Si aún no se encuentra, buscar en allLicitaciones hijas
    if (!lic && this.allLicitaciones) {
      for (const contrato of this.allLicitaciones) {
        if (contrato.EsContratoMarco && contrato.licitaciones && Array.isArray(contrato.licitaciones)) {
          const hija = contrato.licitaciones.find(h => h.IdLicitacion === id);
          if (hija) {
            lic = hija;
            break;
          }
        }
      }
    }
    
    if (lic) {
      localStorage.setItem('Licitacion', JSON.stringify(lic));
      this.router.navigate(['/Licitacion-Detalle']);
    } else {
      console.error('No se encontró la licitación con ID:', id);
    }
  }
  // Maneja el click en la fila de un contrato marco: primero expande, luego abre detalle
  onContratoMarcoRowClick(licitacion: any, index: number) {
    if (!this.expandedRows[licitacion.IdLicitacion]) {
      this.toggleExpand(licitacion.IdLicitacion);
    } else {
      this.Detalle(index);
    }
  }
  // Control de filas expandidas para contratos marco
  expandedRows: { [id: number]: boolean } = {};

  toggleExpand(id: number) {
    this.expandedRows[id] = !this.expandedRows[id];
  }
  // Devuelve las licitaciones hijas de un contrato marco
  getLicitacionesHijas(idContratoMarco: number): any[] {
    return this.Licitaciones.filter(l => l.IdContratoMarco === idContratoMarco);
  }

  // Devuelve el nombre del contrato marco dado su ID
  getNombreContratoMarco(idContratoMarco: number): string {
    const contrato = this.Licitaciones.find(l => l.EsContratoMarco && l.IdLicitacion === idContratoMarco);
    return contrato ? contrato.Descripcion : '';
  }
  // Devuelve el primer hito con ese nombre
  getFechaHito(fechas: any[], nombre: string): any {
    if (!fechas || !Array.isArray(fechas)) return null;
    return fechas.find(f => f.NombreHito === nombre) || null;
  }

  // Devuelve true si existe el hito
  hasHito(fechas: any[], nombre: string): boolean {
    if (!fechas || !Array.isArray(fechas)) return false;
    return fechas.some(f => f.NombreHito === nombre);
  }
  getTotalMontoFiltrado(): string {
    // Filtrar por Estado y/o Competitividad
    const filtrados = this.Licitaciones?.filter(l =>
      (this.drdEstado > 0 ? l.idEstado == this.drdEstado : true) &&
      (this.drdCompetitividad !== '0' ? l.Competitividad == this.drdCompetitividad : true)
    ) || [];
    let total = 0;
    filtrados.forEach(l => {
      // Sumar oferta económica de la licitación principal
      if (Array.isArray(l.ofertaEconomica) && l.ofertaEconomica.length > 0) {
        const monto = Number(l.ofertaEconomica[l.ofertaEconomica.length-1].ValorContraoferta);
        total += isNaN(monto) ? 0 : monto;
      }
      // Si es contrato marco, sumar también las ofertas de sus sublicitaciones
      if (l.EsContratoMarco && l.licitaciones && Array.isArray(l.licitaciones)) {
        l.licitaciones.forEach((hija: any) => {
          if (Array.isArray(hija.ofertaEconomica) && hija.ofertaEconomica.length > 0) {
            const montoHija = Number(hija.ofertaEconomica[hija.ofertaEconomica.length-1].ValorContraoferta);
            total += isNaN(montoHija) ? 0 : montoHija;
          }
        });
      }
    });
    return total.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
  getVisiblePages(): (number | string)[] {
    const pages: (number | string)[] = [];
    const total = this.totalPages;
    const current = this.currentPage;
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current > 3) pages.push(1);
      if (current > 4) pages.push('...');
      for (let i = Math.max(2, current - 2); i <= Math.min(total - 1, current + 2); i++) {
        pages.push(i);
      }
      if (current < total - 3) pages.push('...');
      if (current < total - 2) pages.push(total);
    }
    return pages;
  }
  inputPage: number = 1;
  // Paginación
  pageSize: number = 40;
  currentPage: number = 1;
  get totalPages(): number {
    return Math.ceil((this.Licitaciones?.length || 0) / this.pageSize);
  }
  get pagedLicitaciones(): any[] {
    const start = (this.currentPage - 1) * this.pageSize;
    return this.Licitaciones?.slice(start, start + this.pageSize) || [];
  }

  private ensureValidCurrentPage(): void {
    const total = this.totalPages;
    if (total <= 0) {
      this.currentPage = 1;
      return;
    }
    if (this.currentPage < 1) this.currentPage = 1;
    if (this.currentPage > total) this.currentPage = total;
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  goToPage(page: number) {
    const pageNum = Number(page);
    if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= this.totalPages) {
      this.currentPage = pageNum;
    }
  }

  prevPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  //Filtros
  drdAnio: number = 0;
  AniosDisponibles: number[] = [];
  drdAreas: number = 0;
  Areas: Areas[] = [];
  drdCompetitividad: string = "0";
  drdMandantes: number = 0;
  Mandantes: Mandante[] = [];
  MandantesFiltrados: Mandante[] = [];
  buscarMandanteTexto: string = '';
  drdTipoLicitacion: string = 'todos'; // Nuevo filtro: 'todos', 'contrato_marco', 'normal', 'hija'
  mostrarListaMandantes: boolean = false;
  mandanteSeleccionado: Mandante | null = null;
  drdEjecutivos: number = 0;
  Ejecutivos: Ejecutivos[] = [];
  drdEstado: number = 0;
  Licitaciones: any[] = [];
  allLicitaciones: any[] = [];
  Estados: any[] = [];
  historicos: boolean = false;

  //Generales
  usuario: any = {}

  //Cargando
  Loading: boolean = false;
  LoadingTabla: boolean = true;

  //Mensajes
  msg: string = '';

  //Url
  urlBase: string = "http://trazas-nbi.com:1234/api/";
  controlador: string = "Licitaciones/";
  urlFull: string = this.urlBase + this.controlador;

  constructor(
    private router: Router,
    private http: HttpClient,
    private ofertaEconomica: OfertaEconomicaService
  ) {
    this.historicos = false;
    this.inicializarAniosDisponibles();
    this.GetLicitaciones();

    // Carga Areas solo si no están cargadas
    if (!this.Areas || this.Areas.length === 0) {
      this.http.get<any[]>('http://trazas-nbi.com:1234/api/Area/')
        .subscribe(Area => {
          this.Areas = Area;
        });
    }

    // Carga Mandante solo si no están cargados
    if (!this.Mandantes || this.Mandantes.length === 0) {
      this.http.get<any[]>('http://trazas-nbi.com:1234/api/Mandante/')
        .subscribe(Mandante => {
          this.Mandantes = Mandante;
          this.MandantesFiltrados = Mandante; // Inicializar la lista filtrada
        });
    }

    // Carga Estados solo si no están cargados
    if (!this.Estados || this.Estados.length === 0) {
      this.http.get<any[]>('http://trazas-nbi.com:1234/api/Estado/')
        .subscribe(Estados => {
          this.Estados = Estados;
          // Agregar manualmente los estados especiales si no existen
          // const estadosExtra = [
          //   { IdEstado: 99, NombreEstado: 'Preadjudicada' },
          //   { IdEstado: 100, NombreEstado: 'Contra Oferta' },
          //   { IdEstado: 101, NombreEstado: 'Revision' },
          //   { IdEstado: 102, NombreEstado: 'Revision1' },
          //   { IdEstado: 103, NombreEstado: 'Revision2' },
          //   { IdEstado: 104, NombreEstado: 'Revision3' }
          // ];
          // estadosExtra.forEach(e => {
          //   if (!this.Estados.some(est => est.NombreEstado === e.NombreEstado)) {
          //     this.Estados.push(e);
          //   }
          // });
        });
    }
  }

  ngOnInit() {
    this.drdAnio = 0;
    this.drdAreas = 0;
    this.drdCompetitividad = "0";
    this.drdMandantes = 0;
    this.drdEjecutivos = 0;
    this.drdEstado = 0;
    this.drdTipoLicitacion = 'todos';
    $.getScript("http://trazas-nbi.com/Bootstrap/ajax-bootstrap4/js/settings.js");
    $.getScript("http://trazas-nbi.com/Bootstrap/ajax-bootstrap4/js/app.js");

    // Asegurar que 'Preadjudicada' esté en el select aunque la API tarde
    setTimeout(() => {
      const estadosExtra = [
        { IdEstado: 99, NombreEstado: 'Preadjudicada' },
        { IdEstado: 100, NombreEstado: 'Contra Oferta' },
        { IdEstado: 101, NombreEstado: 'Revision' },
        { IdEstado: 102, NombreEstado: 'Revision1' },
        { IdEstado: 103, NombreEstado: 'Revision2' },
        { IdEstado: 104, NombreEstado: 'Revision3' }
      ];
      estadosExtra.forEach(e => {
        if (!this.Estados.some(est => est.NombreEstado === e.NombreEstado)) {
          this.Estados.push(e);
        }
      });
    }, 1000);

    // Cerrar lista de mandantes al hacer clic fuera
    document.addEventListener('click', (event) => {
      const target = event.target as HTMLElement;
      if (!target.closest('#txtBuscarMandante') && !target.closest('.list-group')) {
        this.mostrarListaMandantes = false;
      }
    });
  }

  Detalle(i: number) {
    localStorage.setItem('Licitacion', JSON.stringify(this.Licitaciones[i]));
    this.router.navigate(['/Licitacion-Detalle']);
  }

  GetLicitaciones() {
    // Obtener licitaciones normales
    this.http.get<any[]>(this.urlFull + 'GetValuesJoin/join')
      .subscribe(Licitacion => {
        const licitacionesNormales = Licitacion.filter(l => l.IdLicitacion && !l.IdContratoMarco);
        // Si Ejecutivos está vacío, cargarlo primero y luego continuar
        if (!this.Ejecutivos || this.Ejecutivos.length === 0) {
          console.warn('Ejecutivos vacío, forzando carga antes de mapear licitaciones');
          this.http.get<any[]>('http://trazas-nbi.com:1234/api/Ejecutivos/')
            .subscribe(ejecutivos => {
              this.Ejecutivos = ejecutivos;
              this.mapearContratosMarcoYSetearLicitaciones(licitacionesNormales);
            });
        } else {
          this.mapearContratosMarcoYSetearLicitaciones(licitacionesNormales);
        }
      });
  }

  // Nueva función fuera de GetLicitaciones
  mapearContratosMarcoYSetearLicitaciones(licitacionesNormales: any[]) {
    this.http.get<any[]>(environment.urlBFF + 'contrato_m')
      .subscribe(contratos => {
        const formatFecha = (fechaIso: string) => {
          const d = new Date(fechaIso);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = d.getFullYear();
          return `${day}/${month}/${year}`;
        };
        console.log('Ejecutivos usados para mapeo:', this.Ejecutivos);
        
        // Clonar licitaciones normales para evitar referencias compartidas
        const licitacionesNormalesClonadas = licitacionesNormales.map(lic => JSON.parse(JSON.stringify(lic)));
        
        const contratosFormateados = contratos
          .filter(c => c.name && c.name.trim() !== '' && c.filename && c.filename.trim() !== '')
          .map(c => {
            const areaObj = this.Areas.find(a => a.IdArea === c.idArea);
            const mandanteObj = this.Mandantes.find(m => m.IdMandante === c.idMandante);
            const ejecutivoObj = this.Ejecutivos.find(e => e.IdEjecutivos === c.idEjecutivo);
            // Mapear nombre de estado usando el catálogo de Estados
            const estadoObj = this.Estados.find(e => e.IdEstado === (c.idEstado || c.IdEstado || 2));
            const contratoMarco = {
              IdLicitacion: c.id,
              Descripcion: c.name,
              NumeroPropuesta: c.filename,
              ofertaEconomica: [],
              NombreArea: areaObj ? areaObj.NombreArea : (c.NombreArea || c.nombreArea || c.area || ''),
              NombreMandante: mandanteObj ? mandanteObj.NombreMandante : (c.NombreMandante || c.nombreMandante || c.mandante || ''),
              NombreEjecutivo: ejecutivoObj ? ejecutivoObj.NombreEjecutivo : (c.NombreEjecutivo || c.nombreEjecutivo || c.ejecutivo || ''),
              NombreEstado: estadoObj ? estadoObj.NombreEstado : 'Pendiente',
              Competitividad: c.competitividad || '',
              FechaCreacion: c.fechaCreacion ? formatFecha(c.fechaCreacion) : formatFecha(new Date().toISOString()),
              fechaOferta: null,
              IdContratoMarco: null,
              EsContratoMarco: true,
              Hitos: [],
              idEstado: c.idEstado || c.IdEstado || 2,
              licitaciones: Array.isArray(c.licitaciones) ? c.licitaciones.map(hija => {
                const areaHija = this.Areas.find(a => a.IdArea === hija.idArea);
                const mandanteHija = this.Mandantes.find(m => m.IdMandante === hija.idMandante);
                const ejecutivoHija = this.Ejecutivos.find(e => e.IdEjecutivos === hija.idEjecutivo);
                const estadoHijaObj = this.Estados.find(e => e.IdEstado === (hija.idEstado || hija.IdEstado || 0));
                return {
                  IdLicitacion: hija.idLicitacion || hija.IdLicitacion || hija.id || null,
                  Descripcion: hija.descripcion || hija.Descripcion || '',
                  NumeroPropuesta: hija.numeroPropuesta || hija.NumeroPropuesta || '',
                  ofertaEconomica: hija.ofertaEconomica || [],
                  NombreArea: areaHija ? areaHija.NombreArea : (hija.NombreArea || hija.nombreArea || hija.area || ''),
                  NombreMandante: mandanteHija ? mandanteHija.NombreMandante : (hija.NombreMandante || hija.nombreMandante || hija.mandante || ''),
                  NombreEjecutivo: ejecutivoHija ? ejecutivoHija.NombreEjecutivo : (hija.NombreEjecutivo || hija.nombreEjecutivo || hija.ejecutivo || ''),
                  NombreEstado: estadoHijaObj ? estadoHijaObj.NombreEstado : (hija.NombreEstado || hija.nombreEstado || ''),
                  Competitividad: hija.Competitividad || hija.competitividad || '',
                  FechaCreacion: hija.FechaCreacion || hija.fechaCreacion || '',
                  fechaOferta: hija.fechaOferta || '',
                  IdContratoMarco: c.id,
                  EsContratoMarco: false,
                  Hitos: hija.Hitos || [],
                  idEstado: hija.idEstado || hija.IdEstado || 0,
                  // Mapear campos faltantes igual que las licitaciones normales
                  Activo: hija.Activo !== undefined ? hija.Activo : null,
                  FechaRemocion: hija.FechaRemocion || null,
                  IdUsuarioCreador: hija.IdUsuarioCreador || null,
                  IdUsuarioRemovedor: hija.IdUsuarioRemovedor || null
                };
              }) : []
            };
            return contratoMarco;
          });

        // Estructura final: contratos marco (con hijas en .licitaciones) + licitaciones normales sin contrato marco
        // IMPORTANTE: Usar las licitaciones clonadas para evitar referencias compartidas
        let temp = [...contratosFormateados, ...licitacionesNormalesClonadas];

        // ❌ FILTRO ANTI-DUPLICADOS: Eliminar licitaciones normales que ya están como hijas
        const idsHijas = new Set<number>();
        
        // Recopilar todos los IDs de licitaciones hijas
        contratosFormateados.forEach(contrato => {
          if (contrato.licitaciones && Array.isArray(contrato.licitaciones)) {
            contrato.licitaciones.forEach(hija => {
              if (hija.IdLicitacion) {
                idsHijas.add(hija.IdLicitacion);
              }
            });
          }
        });
        
        console.log('🔍 IDs de licitaciones hijas a excluir:', Array.from(idsHijas));
        
        // Filtrar licitaciones normales clonadas que NO estén en las hijas
        const licitacionesSinDuplicados = licitacionesNormalesClonadas.filter(licitacion => 
          !idsHijas.has(licitacion.IdLicitacion)
        );
        
        console.log('🔧 Licitaciones normales originales:', licitacionesNormalesClonadas.length);
        console.log('🔧 Licitaciones normales sin duplicados:', licitacionesSinDuplicados.length);
        
        // Reconstruir el array sin duplicados
        temp = [...contratosFormateados, ...licitacionesSinDuplicados];

        // Aplicar todos los filtros
        temp = this.aplicarFiltros(temp);
        
        this.Licitaciones = temp;
        this.eliminarLicitacionesDuplicadas();
        this.ensureValidCurrentPage();
        this.GetFechaOfertaEconomica(this.Licitaciones);
        this.ordenarPorIdDesc();
        this.Loading = false;
        this.LoadingTabla = false;
    });
  }

  // Función auxiliar para aplicar filtros
  aplicarFiltros(temp: any[]): any[] {
    // Filtro de históricos: mostrar todos los años

    // Filtro por año (fecha de creación)
    if (this.drdAnio > 0) {
      temp = temp.filter(element => {
        if (element.FechaCreacion) {
          let anioElemento;
          if (typeof element.FechaCreacion === 'string') {
            if (element.FechaCreacion.includes('/')) {
              const partes = element.FechaCreacion.split('/');
              if (partes.length === 3) {
                anioElemento = parseInt(partes[2]);
              }
            } else {
              const fechaCreacion = new Date(element.FechaCreacion);
              anioElemento = fechaCreacion.getFullYear();
            }
          } else {
            const fechaCreacion = new Date(element.FechaCreacion);
            anioElemento = fechaCreacion.getFullYear();
          }
          return anioElemento === parseInt(this.drdAnio.toString());
        }
        return false;
      });
    }

    // Filtro por área
    if (this.drdAreas > 0) {
      const areaSeleccionada = this.Areas.find(area => area.IdArea == this.drdAreas);
      if (areaSeleccionada) {
        temp = temp.filter(element => element.NombreArea === areaSeleccionada.NombreArea);
      }
    }

    // Filtro por estado
    if (this.drdEstado > 0) {
      temp = temp.filter(element => element.idEstado == this.drdEstado);
    }

    // Filtro por competitividad
    if (this.drdCompetitividad != "0") {
      temp = temp.filter(element => element.Competitividad == this.drdCompetitividad);
    }

    // Filtro por mandante si hay uno seleccionado
    if (this.mandanteSeleccionado) {
      temp = temp.filter(element => element.NombreMandante === this.mandanteSeleccionado!.NombreMandante);
    }

    // Filtro por tipo de licitación
    if (this.drdTipoLicitacion !== 'todos') {
      if (this.drdTipoLicitacion === 'contrato_marco') {
        temp = temp.filter(element => element.EsContratoMarco === true);
      } else if (this.drdTipoLicitacion === 'normal') {
        temp = temp.filter(element => !element.EsContratoMarco && !element.IdContratoMarco);
      } else if (this.drdTipoLicitacion === 'hija') {
        // Aplanar todas las licitaciones hijas de los contratos marco
        const hijas: any[] = [];
        temp.forEach(element => {
          if (element.EsContratoMarco && Array.isArray(element.licitaciones)) {
            hijas.push(...element.licitaciones);
          }
        });
        temp = hijas;
      }
    }

    // Mostrar perdidas, postergadas, carta excusa y anulada SOLO si el filtro de históricos está activo
    if (!this.historicos) {
      temp = temp.filter(element => {
        const estado1 = (element.NombreEstado || '').toLowerCase().replace(/\s+/g, '');
        const estado2 = (element.estado || '').toLowerCase().replace(/\s+/g, '');
        return estado1 !== 'cartaexcusa' && estado2 !== 'cartaexcusa'
          && estado1 !== 'perdida' && estado2 !== 'perdida'
          && estado1 !== 'anulada' && estado2 !== 'anulada'
          && estado1 !== 'postergada' && estado2 !== 'postergada'
          && estado1 !== 'adjudicada' && estado2 !== 'adjudicada';
      });
    }

    // Al activar históricos, mostrar todos los estados (no excluir ninguno)

    return temp;
  }

  chargeAlllicitaciones() {
    this.historicos = !this.historicos;
    console.log('Toggle históricos. Nuevo estado:', this.historicos);
    
    // En lugar de usar this.allLicitaciones, hacer una nueva consulta aplicando los filtros
    this.currentPage = 1;
    this.Buscar();
  }

  GetFechaOfertaEconomica(licitaciones: any[]) {
    // licitaciones = licitaciones.sort((a, b) => a.IdLicitacion > b.IdLicitacion ? 1 : -1)
    // console.log(licitaciones);
    // let arr: any[] = []
    // arr.slice(0,49)
    licitaciones.forEach(element => {
      // Solo procesar licitaciones normales (NO contratos marco)
      if (!element.EsContratoMarco) {
        element.fechaOferta = this.getDetalleOC(element.IdLicitacion);
        this.ofertaEconomica.getOfertasEconomicas(element.IdLicitacion).subscribe(ofertas => {
          element.ofertaEconomica = ofertas;
        });
      }
      
      // Procesar las licitaciones hijas si es un contrato marco
      if (element.EsContratoMarco && element.licitaciones && Array.isArray(element.licitaciones)) {
        element.licitaciones.forEach(hija => {
          if (hija.IdLicitacion) {
            hija.fechaOferta = this.getDetalleOC(hija.IdLicitacion);
            this.ofertaEconomica.getOfertasEconomicas(hija.IdLicitacion).subscribe(ofertas => {
              hija.ofertaEconomica = ofertas;
            });
          }
        });
      }
    });

  }

  getDetalleOC(IdLicitacion: number) {
    return this.http.get<any[]>(environment.urlBase + "Licitaciones/GetHitosHitosLicitacionByLicitaciones/IdLicitacion=" + IdLicitacion)
  }

  // Devuelve el hito más próximo relevante (entrega, visita, revision1, revision2, revision3)
    // Devuelve el hito más próximo relevante según lista específica del usuario
    getHitoProximo(licitacion: any): any {
      if (!licitacion.Hitos || !Array.isArray(licitacion.Hitos)) return null;
      const nombresRelevantes = [
        'visita opcional',
        'visita obligatoria',
        'reunion aclaratoria',
        'consultas',
        'rev-01',
        'rev-02',
        'rev-03',
        'rev-04'
      ];
      // Normaliza texto para comparación flexible
      const normalizar = (str: string) => str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9 ]/g, '');

      // Buscar hitos relevantes, aunque no tengan fecha
      const relevantes = licitacion.Hitos.filter(h => {
        if (!h.NombreHito) return false;
        const nombre = normalizar(h.NombreHito);
        return nombresRelevantes.some(nr => nombre.includes(normalizar(nr)));
      });
      // Si hay fechas, ordenar por la más próxima
      const conFecha = relevantes.filter(h => h.FechaCompromiso);
      conFecha.sort((a, b) => new Date(a.FechaCompromiso).getTime() - new Date(b.FechaCompromiso).getTime());
      if (conFecha.length > 0) return conFecha[0];
      // Si no hay fechas, devolver el primer relevante (sin fecha)
      return relevantes.length > 0 ? relevantes[0] : null;
    }

  // Ordena las licitaciones por el hito más próximo
  ordenarPorHitoProximo() {
    this.Licitaciones.sort((a, b) => {
      const hitoA = this.getHitoProximo(a);
      const hitoB = this.getHitoProximo(b);
      const fechaA = hitoA ? new Date(hitoA.FechaCompromiso).getTime() : Infinity;
      const fechaB = hitoB ? new Date(hitoB.FechaCompromiso).getTime() : Infinity;
      return fechaA - fechaB;
    });
  }

  // Funciones para el buscador de mandantes
  filtrarMandantes() {
    if (this.buscarMandanteTexto.trim() === '') {
      this.MandantesFiltrados = this.Mandantes;
      this.mandanteSeleccionado = null;
      this.drdMandantes = 0;
      this.mostrarListaMandantes = false;
      // Si se borra el texto, ejecutar búsqueda para quitar el filtro
      this.Buscar();
    } else {
      this.MandantesFiltrados = this.Mandantes.filter(mandante =>
        mandante.NombreMandante.toLowerCase().includes(this.buscarMandanteTexto.toLowerCase())
      );
      // Si hay texto pero no hay mandante seleccionado, limpiar la selección
      if (this.mandanteSeleccionado && 
          !this.mandanteSeleccionado.NombreMandante.toLowerCase().includes(this.buscarMandanteTexto.toLowerCase())) {
        this.mandanteSeleccionado = null;
        this.drdMandantes = 0;
      }
      this.mostrarListaMandantes = this.MandantesFiltrados.length > 0;
    }
  }

  seleccionarMandante(mandante: Mandante) {
    this.mandanteSeleccionado = mandante;
    this.buscarMandanteTexto = mandante.NombreMandante;
    this.drdMandantes = mandante.IdMandante;
    this.mostrarListaMandantes = false;
    this.Buscar(); // Ejecutar búsqueda automáticamente
  }

  Buscar() {
    this.Loading = true;
    this.LoadingTabla = true;

    console.log('=== INICIO BÚSQUEDA ===');
    console.log('Filtros activos:', {
      año: this.drdAnio,
      area: this.drdAreas,
      estado: this.drdEstado,
      competitividad: this.drdCompetitividad,
      mandante: this.mandanteSeleccionado?.NombreMandante || 'Ninguno',
      tipoLicitacion: this.drdTipoLicitacion,
      historicos: this.historicos
    });

    // Usar la misma lógica que GetLicitaciones para cargar y filtrar
    this.http.get<any[]>(this.urlFull + 'GetValuesJoin/join')
      .subscribe(Licitacion => {
        const licitacionesNormales = Licitacion.filter(l => l.IdLicitacion && !l.IdContratoMarco);
        
        // Siempre usar la función que mapea contratos marco y aplica filtros
        if (!this.Ejecutivos || this.Ejecutivos.length === 0) {
          console.warn('Ejecutivos vacío, forzando carga antes de mapear licitaciones');
          this.http.get<any[]>('http://trazas-nbi.com:1234/api/Ejecutivos/')
            .subscribe(ejecutivos => {
              this.Ejecutivos = ejecutivos;
              this.mapearContratosMarcoYSetearLicitaciones(licitacionesNormales);
            });
        } else {
          this.mapearContratosMarcoYSetearLicitaciones(licitacionesNormales);
        }
      });
  }

  private parseIdToNumber(value: any): number {
    if (typeof value === 'number') return isFinite(value) ? value : Number.NEGATIVE_INFINITY;
    if (typeof value === 'string') {
      const n = parseInt(value, 10);
      return isNaN(n) ? Number.NEGATIVE_INFINITY : n;
    }
    return Number.NEGATIVE_INFINITY;
  }

  ordenarPorIdDesc() {
    if (!this.Licitaciones || this.Licitaciones.length === 0) return;
    this.Licitaciones.sort((a, b) => {
      const idA = this.parseIdToNumber(a?.IdLicitacion ?? a?.id);
      const idB = this.parseIdToNumber(b?.IdLicitacion ?? b?.id);
      return idB - idA;
    });
  }

  // Inicializar años disponibles (últimos 10 años + año actual + próximo año)
  inicializarAniosDisponibles() {
    const anioActual = new Date().getFullYear();
    this.AniosDisponibles = [];
    
    // Agregar años desde 5 años atrás hasta 2 años adelante
    for (let i = anioActual - 5; i <= anioActual + 2; i++) {
      this.AniosDisponibles.push(i);
    }
    
    // Ordenar de forma descendente (años más recientes primero)
    this.AniosDisponibles.sort((a, b) => b - a);
  }

  // Limpiar todos los filtros
  LimpiarFiltros() {
    this.drdAnio = 0;
    this.drdAreas = 0;
    this.drdCompetitividad = "0";
    this.drdEstado = 0;
    this.buscarMandanteTexto = '';
    this.mandanteSeleccionado = null;
    this.drdMandantes = 0;
    this.drdTipoLicitacion = 'todos';
    this.MandantesFiltrados = this.Mandantes;
    this.mostrarListaMandantes = false;

    this.currentPage = 1;
    
    // Recargar datos sin filtros
    this.GetLicitaciones();
  }

  // Contar filtros activos
  contarFiltrosActivos(): number {
    let count = 0;
    
    if (this.drdAnio > 0) count++;
    if (this.drdAreas > 0) count++;
    if (this.drdCompetitividad !== "0") count++;
    if (this.drdEstado > 0) count++;
    if (this.mandanteSeleccionado) count++;
    if (this.drdTipoLicitacion !== 'todos') count++;
    
    return count;
  }

  // Obtener suma de ofertas por tipo de licitación
  getSumaOfertasPorTipo(tipo: string): number {
    let total = 0;
    
    if (tipo === 'contrato_marco') {
      const contratosMarco = this.Licitaciones.filter(l => l.EsContratoMarco === true);
      contratosMarco.forEach(l => {
        if (Array.isArray(l.ofertaEconomica) && l.ofertaEconomica.length > 0) {
          const monto = Number(l.ofertaEconomica[l.ofertaEconomica.length - 1].ValorContraoferta);
          total += isNaN(monto) ? 0 : monto;
        }
      });
    } else if (tipo === 'normal') {
      const normales = this.Licitaciones.filter(l => !l.EsContratoMarco && !l.IdContratoMarco);
      normales.forEach(l => {
        if (Array.isArray(l.ofertaEconomica) && l.ofertaEconomica.length > 0) {
          const monto = Number(l.ofertaEconomica[l.ofertaEconomica.length - 1].ValorContraoferta);
          total += isNaN(monto) ? 0 : monto;
        }
      });
    } else if (tipo === 'hija') {
      // Buscar en las licitaciones hijas dentro de los contratos marco
      this.Licitaciones.forEach(l => {
        if (l.EsContratoMarco && Array.isArray(l.licitaciones)) {
          l.licitaciones.forEach(hija => {
            if (Array.isArray(hija.ofertaEconomica) && hija.ofertaEconomica.length > 0) {
              const monto = Number(hija.ofertaEconomica[hija.ofertaEconomica.length - 1].ValorContraoferta);
              total += isNaN(monto) ? 0 : monto;
            }
          });
        }
      });
    } else if (tipo === 'todos') {
      // Sumar todas (contratos marco + normales + hijas)
      total = this.getSumaOfertasPorTipo('contrato_marco') + 
              this.getSumaOfertasPorTipo('normal') + 
              this.getSumaOfertasPorTipo('hija');
    }
    
    return total;
  }

  // Obtener suma formateada de ofertas por tipo
  getTotalCLPPorTipo(tipo: string): string {
    const total = this.getSumaOfertasPorTipo(tipo);
    return '$' + this.formatMonto(total);
  }

  // Obtener cantidad por tipo de licitación
  getCantidadPorTipo(tipo: string): number {
    if (tipo === 'contrato_marco') {
      return this.Licitaciones.filter(l => l.EsContratoMarco === true).length;
    } else if (tipo === 'normal') {
      return this.Licitaciones.filter(l => !l.EsContratoMarco && !l.IdContratoMarco).length;
    } else if (tipo === 'hija') {
      let count = 0;
      this.Licitaciones.forEach(l => {
        if (l.EsContratoMarco && Array.isArray(l.licitaciones)) {
          count += l.licitaciones.length;
        }
      });
      return count;
    }
    
    return this.Licitaciones.length;
  }



  // Función para eliminar licitaciones duplicadas
  eliminarLicitacionesDuplicadas() {
    if (!this.Licitaciones || this.Licitaciones.length === 0) return;

    // Recopilar IDs de todas las licitaciones hijas
    const idsHijas = new Set<number>();
    
    this.Licitaciones.forEach(elemento => {
      if (elemento.EsContratoMarco && elemento.licitaciones && Array.isArray(elemento.licitaciones)) {
        elemento.licitaciones.forEach(hija => {
          if (hija.IdLicitacion) {
            idsHijas.add(hija.IdLicitacion);
          }
        });
      }
    });

    // Filtrar licitaciones que no sean contratos marco y no estén en la lista de hijas
    this.Licitaciones = this.Licitaciones.filter(elemento => {
      // Mantener los contratos marco (EsContratoMarco = true)
      if (elemento.EsContratoMarco) {
        return true;
      }
      // Para licitaciones normales, mantener solo las que NO están como hijas
      return !idsHijas.has(elemento.IdLicitacion);
    });

    this.ensureValidCurrentPage();
  }

  formatMonto(monto: number | string): string {
    if (!monto && monto !== 0) return '';
    const num = Number(monto);
    if (isNaN(num)) return '';
    return num.toLocaleString('es-CL', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
}
