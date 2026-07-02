// Interfaz para el resultado de año máximo
interface MaxYearResult {
  year: number;
  value: number;
}
// ...existing code...
import { Component, OnInit, NgZone, AfterViewInit } from '@angular/core';
import Chart from 'chart.js/auto';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NavComponent } from '../../nav/nav.component';
import { HeaderComponent } from '../../header/header.component';

declare var Morris: any;
declare var jQuery: any;
declare var $: any;
// Register Chart.js datalabels plugin
Chart.register(ChartDataLabels);

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [CommonModule, NavComponent, HeaderComponent, FormsModule],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit, AfterViewInit {
    // Filtros independientes para cada sección

    // Datos filtrados para cada sección (puedes ajustar los nombres según tu lógica actual)
    filteredMandantesResumen: any[] = [];

    // Funciones de cambio de filtro

    // Métodos de filtrado (debes implementar la lógica real según tus datos)
    filtrarMandantesPorAnios() {
      // Filtra las licitaciones por año y recalcula el resumen de mandantes
      if (!this.licitaciones || this.licitaciones.length === 0) {
        this.filteredMandantesResumen = [];
        return;
      }
      const maxYear = Math.max(...this.licitaciones.map(l => l.Agno || l.agno || l.anio || l.year));
      const range = parseInt(this.clienteYearFilter, 10);
      const licFiltradas = this.licitaciones.filter(l => {
        const agno = l.Agno || l.agno || l.anio || l.year;
        return agno >= maxYear - range + 1;
      });
      // Recalcular resumen de mandantes filtrado
      const resumen: { [mandante: string]: number } = {};
      licFiltradas.forEach(l => {
        const mandante = l.NombreMandante || 'Sin Mandante';
        resumen[mandante] = (resumen[mandante] || 0) + 1;
      });
      this.filteredMandantesResumen = Object.entries(resumen).map(([mandante, cantidad]) => ({ mandante, cantidad }));
      // Actualizar datos del gráfico de barras
      this.mandantesChartData = this.filteredMandantesResumen.map(m => ({ label: m.mandante, value: m.cantidad }));
    }

    filtrarConstruccionPorAnios() {
      if (!this.tblConstruccion || this.tblConstruccion.length === 0) {
        this.filteredTblConstruccion = [];
        return;
      }
      const maxYear = Math.max(...this.tblConstruccion.map(r => r.agno));
      const range = parseInt(this.construccionYearFilter, 10);
      this.filteredTblConstruccion = this.tblConstruccion.filter(r => r.agno >= maxYear - range + 1);
    }

    filtrarArquitecturaPorAnios() {
      if (!this.tblArquitectura || this.tblArquitectura.length === 0) {
        this.filteredTblArquitectura = [];
        return;
      }
      const maxYear = Math.max(...this.tblArquitectura.map(r => r.agno));
      const range = parseInt(this.arquitecturaYearFilter, 10);
      this.filteredTblArquitectura = this.tblArquitectura.filter(r => r.agno >= maxYear - range + 1);
    }

    // Métodos para refrescar los gráficos (debes tenerlos o implementarlos)
    // Filtros independientes para cada sección
  clienteYearFilter: string = 'all';
  construccionYearFilter: string = 'all';
  arquitecturaYearFilter: string = 'all';

    // Handlers para los selects de filtro
    onClienteYearFilterChange() {
      this.filtrarMandantesPorAnios();
      this.renderMandantesBarChart();
    }
    onConstruccionYearFilterChange() {
      this.filtrarConstruccionPorAnios();
      this.renderConstruccionChart();
    }
    onArquitecturaYearFilterChange() {
      this.filtrarArquitecturaPorAnios();
      this.renderArquitecturaChart();
    }

    // Métodos de filtrado (debes implementar la lógica real según tus datos)
  // Devuelve el total de la línea de años (Adjudicada + Entregada + Perdida + Otros)
  getTotalLineaAgno(): number {
    let total = 0;
    if (!Array.isArray(this.filteredTblLineaAgno)) return 0;
    for (const row of this.filteredTblLineaAgno) {
      total += (row.Adjudicada || 0) + (row.Entregada || 0) + (row.Perdida || 0) + (row.Anulada || 0) + (row.CartaExcusa || 0) + (row.Estudio || 0) + (row.Pendiente || 0) + (row.Postergada || 0);
    }
    return total;
  }

  renderBarChartEstadosAnual() {
    const ctx = (document.getElementById('barChartEstadosAnual') as HTMLCanvasElement)?.getContext('2d');
    if (!ctx) return;
    if ((window as any).barChartEstadosAnualInstance) {
      (window as any).barChartEstadosAnualInstance.destroy();
    }
    // Usa los datos filtrados por año
  const data = [...this.filteredTblLineaAgnoDesc].reverse();
  const labels = data.map(row => row.agno);
  const estados = ['Adjudicada', 'Entregada', 'Perdida', 'Otros', 'Total', '% Adjudicación'];
  const colors = ['#39FF14', '#01b0f1', '#dc3545', '#888', '#222', '#7CFC98']; // Verde aún más claro para % Adjudicación
    const datasets = estados.map((estado, i) => {
      let values;
      if (estado === 'Otros') {
        values = data.map(row => (row.Anulada || 0) + (row.CartaExcusa || 0) + (row.Estudio || 0) + (row.Pendiente || 0) + (row.Postergada || 0));
      } else if (estado === 'Total') {
        values = data.map(row =>
          (row.Adjudicada || 0) + (row.Entregada || 0) + (row.Perdida || 0) +
          (row.Anulada || 0) + (row.CartaExcusa || 0) + (row.Estudio || 0) + (row.Pendiente || 0) + (row.Postergada || 0)
        );
      } else if (estado === '% Adjudicación') {
        values = data.map(row => {
          const total = (row.Adjudicada || 0) + (row.Entregada || 0) + (row.Perdida || 0) +
            (row.Anulada || 0) + (row.CartaExcusa || 0) + (row.Estudio || 0) + (row.Pendiente || 0) + (row.Postergada || 0);
          return total > 0 ? Math.round((row.Adjudicada || 0) * 1000 / total) / 10 : 0;
        });
      } else {
        values = data.map(row => row[estado] || 0);
      }
      const base = {
        label: estado,
        data: values,
        backgroundColor: colors[i],
        borderColor: colors[i],
        borderWidth: 2,
        maxBarThickness: 38,
        order: estado === 'Total' ? 99 : (estado === '% Adjudicación' ? 100 : i)
      };
      if (estado === 'Total') {
        return { ...base, type: 'line' as const };
      }
      if (estado === '% Adjudicación') {
        return {
          ...base,
          type: 'line' as const,
          borderColor: '#007bff', // azul
          backgroundColor: '#007bff',
          pointBackgroundColor: '#007bff',
          pointBorderColor: '#fff',
          pointStyle: 'circle',
          pointRadius: 5, // tamaño intermedio
          pointHoverRadius: 7,
          fill: false,
          yAxisID: 'y2',
          tension: 0.5 // curva suavizada
        };
      }
      return base;
    });
    (window as any).barChartEstadosAnualInstance = new Chart(ctx, {
      type: 'bar',
      data: { labels, datasets },
      options: {
        indexAxis: 'x',
        plugins: {
          legend: { display: true, position: 'top' },
          datalabels: { display: false },
          tooltip: {
            enabled: true,
            callbacks: {
              label: function(context: any) {
                const value = context.parsed.y;
                if (context.dataset.label === '% Adjudicación') {
                  return `% Adjudicación: ${value}%`;
                }
                return `${context.dataset.label}: ${value}`;
              }
            }
          }
        },
        responsive: true,
        layout: { padding: { left: 10, right: 10, top: 10, bottom: 10 } },
        scales: {
          x: {
            title: { display: true, text: 'Año', font: { size: 14, weight: 'bold' }, color: '#444' },
            grid: { color: '#f3f3f3' },
            ticks: { font: { size: 12 }, color: '#444' }
          },
          y: {
            title: { display: true, text: 'Cantidad', font: { size: 14, weight: 'bold' }, color: '#444' },
            beginAtZero: true,
            grid: { color: '#f3f3f3' },
            ticks: { font: { size: 12 }, color: '#444' }
          },
          y2: {
            position: 'right',
            title: { display: true, text: '% Adjudicación', font: { size: 14, weight: 'bold' }, color: '#1976d2' },
            beginAtZero: true,
            min: 0,
            max: 100,
            grid: { drawOnChartArea: false },
            ticks: { font: { size: 12 }, color: '#1976d2', callback: (v: any) => v + '%' }
          }
        }
      }
    });
  }

  renderBarChartEstados() {
    const ctx = (document.getElementById('barChartEstados') as HTMLCanvasElement)?.getContext('2d');
    if (!ctx) return;
    if ((window as any).barChartEstadosInstance) {
      (window as any).barChartEstadosInstance.destroy();
    }
    // Obtén los totales filtrados
    const data = [
      this.filteredGlobalTotals.Adjudicada || 0,
      this.filteredGlobalTotals.Perdida || 0,
      (this.filteredGlobalTotals.Otros || 0) + (this.filteredGlobalTotals.Entregada || 0),
      (this.filteredGlobalTotals.Adjudicada || 0) + (this.filteredGlobalTotals.Perdida || 0) + (this.filteredGlobalTotals.Otros || 0) + (this.filteredGlobalTotals.Entregada || 0)
    ];
    const labels = ['Adjudicada', 'Perdida', 'Otros', 'Total'];
    const colors = ['#39FF14', '#dc3545', '#888', '#222'];
    (window as any).barChartEstadosInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Cantidad',
          data,
          backgroundColor: colors,
          borderColor: colors,
          borderWidth: 1.5,
          maxBarThickness: 48,
          minBarLength: 8
        }]
      },
      options: {
        indexAxis: 'y',
        plugins: {
          legend: { display: false },
          datalabels: { display: true, color: '#222', font: { weight: 'bold', size: 14 } },
          tooltip: {
            enabled: true,
            callbacks: {
              label: function(context: any) {
                const value = context.parsed.x;
                const total = data[3];
                const pct = total ? ((value / total) * 100).toFixed(1) : '0';
                return `${value} (${pct}%)`;
              }
            }
          }
        },
        responsive: true,
        layout: { padding: { left: 10, right: 10, top: 10, bottom: 10 } },
        scales: {
          x: {
            title: { display: true, text: 'Cantidad', font: { size: 14, weight: 'bold' }, color: '#444' },
            beginAtZero: true,
            grid: { color: '#f3f3f3' },
            ticks: { font: { size: 12 }, color: '#444' }
          },
          y: {
            title: { display: true, text: 'Estado', font: { size: 14, weight: 'bold' }, color: '#444' },
            grid: { color: '#f3f3f3' },
            ticks: { font: { size: 12 }, color: '#444' }
          }
        }
      }
    });
  }
  // Devuelve los datos de la evolución temporal ordenados de más actual a más antiguo
  get filteredTblLineaAgnoDesc() {
    if (!this.filteredTblLineaAgno) return [];
    return [...this.filteredTblLineaAgno].sort((a, b) => b.agno - a.agno);
  }
  // Totales para reseña de gráfico principal
  getTotalOtrosLineaAgno(): number {
    if (!this.filteredTblLineaAgno) return 0;
    return this.filteredTblLineaAgno.reduce((sum, r) => sum + ((r.Anulada || 0) + (r.CartaExcusa || 0) + (r.Estudio || 0) + (r.Pendiente || 0) + (r.Postergada || 0)), 0);
  }
  getTotalPrincipalLineaAgno(): number {
    if (!this.filteredTblLineaAgno) return 0;
    return this.filteredTblLineaAgno.reduce((sum, r) => sum + this.getTotalForYear(r), 0);
  }

  // Totales para reseña de gráfico construcción
  getTotalAdjudicadaConstruccion(): number {
    if (!this.filteredTblConstruccion) return 0;
    return this.filteredTblConstruccion.reduce((sum, r) => sum + (r.Adjudicada || 0), 0);
  }
  getTotalEntregadaConstruccion(): number {
    if (!this.filteredTblConstruccion) return 0;
    return this.filteredTblConstruccion.reduce((sum, r) => sum + (r.Entregada || 0), 0);
  }
  getTotalPerdidaConstruccion(): number {
    if (!this.filteredTblConstruccion) return 0;
    return this.filteredTblConstruccion.reduce((sum, r) => sum + (r.Perdida || 0), 0);
  }
  getTotalOtrosConstruccion(): number {
    if (!this.filteredTblConstruccion) return 0;
    return this.filteredTblConstruccion.reduce((sum, r) => sum + ((r.Anulada || 0) + (r.CartaExcusa || 0) + (r.Estudio || 0) + (r.Pendiente || 0) + (r.Postergada || 0)), 0);
  }
  getTotalPrincipalConstruccion(): number {
    if (!this.filteredTblConstruccion) return 0;
    return this.filteredTblConstruccion.reduce((sum, r) => sum + this.getTotalForYear(r), 0);
  }

  // Totales para reseña de gráfico arquitectura
  getTotalAdjudicadaArquitectura(): number {
    if (!this.filteredTblArquitectura) return 0;
    return this.filteredTblArquitectura.reduce((sum, r) => sum + (r.Adjudicada || 0), 0);
  }
  getTotalEntregadaArquitectura(): number {
    if (!this.filteredTblArquitectura) return 0;
    return this.filteredTblArquitectura.reduce((sum, r) => sum + (r.Entregada || 0), 0);
  }
  getTotalPerdidaArquitectura(): number {
    if (!this.filteredTblArquitectura) return 0;
    return this.filteredTblArquitectura.reduce((sum, r) => sum + (r.Perdida || 0), 0);
  }
  getTotalOtrosArquitectura(): number {
    if (!this.filteredTblArquitectura) return 0;
    return this.filteredTblArquitectura.reduce((sum, r) => sum + ((r.Anulada || 0) + (r.CartaExcusa || 0) + (r.Estudio || 0) + (r.Pendiente || 0) + (r.Postergada || 0)), 0);
  }
  getTotalPrincipalArquitectura(): number {
    if (!this.filteredTblArquitectura) return 0;
    return this.filteredTblArquitectura.reduce((sum, r) => sum + this.getTotalForYear(r), 0);
  }
  // Devuelve los años en que el mandante tuvo más licitaciones (puede ser más de uno si hay empate)
  getAgnosMasUsadosPorMandante(mandante: string): number[] {
    if (!this.licitaciones) return [];
    const conteoPorAgno: { [agno: number]: number } = {};
    this.licitaciones.forEach(l => {
      const nombre = l.NombreMandante || 'Sin Mandante';
      let fecha = l.FechaCreacion || l.Fecha || l.fechaCreacion || l.fecha;
      let agno: number | null = null;
      if (fecha) {
        // Si la fecha es tipo string, extraer el año
        if (typeof fecha === 'string') {
          const match = fecha.match(/\d{4}/);
          if (match) agno = Number(match[0]);
        } else if (fecha instanceof Date) {
          agno = fecha.getFullYear();
        }
      }
      if (nombre === mandante && typeof agno === 'number' && !isNaN(agno)) {
        conteoPorAgno[agno] = (conteoPorAgno[agno] || 0) + 1;
      }
    });
    const max = Math.max(...Object.values(conteoPorAgno));
    return Object.entries(conteoPorAgno)
      .filter(([agno, cantidad]) => cantidad === max)
      .map(([agno]) => Number(agno));
  }
  yearFilter: string = 'all';
  filteredTblLineaAgno: any[] = [];
  filteredTblConstruccion: any[] = [];
  filteredTblArquitectura: any[] = [];
  // Filtra los datos según el filtro de años seleccionado
  filterByYear(data: any[]): any[] {
  if (!data) return [];
  const validRanges = ['3', '5', '10'];
  const range = validRanges.includes(this.yearFilter) ? parseInt(this.yearFilter, 10) : data.length;
  const maxYear = Math.max(...data.map(d => d.agno));
  return data.filter(d => d.agno >= maxYear - range + 1);
  }

  onYearFilterChange() {
  this.filteredTblLineaAgno = this.filterByYear(this.tblLineaAgno);
  this.filteredTblConstruccion = this.filterByYear(this.tblConstruccion);
  this.filteredTblArquitectura = this.filterByYear(this.tblArquitectura);
  // Forzar actualización de ambos gráficos y la tabla
  this.renderBarChartEstadosAnual();
  this.renderEvolucionTemporalChart();
  // Si tienes otros métodos de actualización, agrégalos aquí
  }

  updateCharts() {
    // Actualiza los gráficos de línea para los datos filtrados
    this.renderEvolucionTemporalChart();
    this.renderConstruccionChart();
    this.renderArquitecturaChart();
  }

  renderEvolucionTemporalChart() {
    const ctx = (document.getElementById('evolucionTemporalChart') as HTMLCanvasElement)?.getContext('2d');
    if (!ctx) return;
    if ((window as any).evolucionTemporalChart && typeof (window as any).evolucionTemporalChart.destroy === 'function') {
      (window as any).evolucionTemporalChart.destroy();
    }
  const dataDesc = [...this.filteredTblLineaAgno].sort((a, b) => b.agno - a.agno).reverse();
  const labels = dataDesc.map(row => row.agno);
    const getOtros = (row: any) => (row.Anulada || 0) + (row.CartaExcusa || 0) + (row.Estudio || 0) + (row.Pendiente || 0) + (row.Postergada || 0);
    // Calcular porcentajes por año
    const datasets = [
      {
        label: 'Adjudicada',
        data: dataDesc.map(row => {
          const total = (row.Adjudicada || 0) + (row.Perdida || 0) + getOtros(row) + (row.Entregada || 0);
          return total > 0 ? Math.round((row.Adjudicada || 0) * 1000 / total) / 10 : 0;
        }),
        borderColor: '#39FF14',
        backgroundColor: '#39FF14',
        fill: false,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: '#39FF14',
        pointBorderColor: '#fff',
        pointStyle: 'circle',
        hoverBorderWidth: 2,
        spanGaps: false,
      },
      {
        label: 'Perdida',
        data: dataDesc.map(row => {
          const total = (row.Adjudicada || 0) + (row.Perdida || 0) + getOtros(row) + (row.Entregada || 0);
          return total > 0 ? Math.round((row.Perdida || 0) * 1000 / total) / 10 : 0;
        }),
        borderColor: '#dc3545',
        backgroundColor: '#dc3545',
        fill: false,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: '#dc3545',
        pointBorderColor: '#fff',
        pointStyle: 'circle',
        hoverBorderWidth: 2,
        spanGaps: false,
      },
      {
        label: 'Otros',
        data: dataDesc.map(row => {
          const total = (row.Adjudicada || 0) + (row.Perdida || 0) + getOtros(row) + (row.Entregada || 0);
          return total > 0 ? Math.round((getOtros(row) + (row.Entregada || 0)) * 1000 / total) / 10 : 0;
        }),
        borderColor: '#888',
        backgroundColor: '#888',
        fill: false,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: '#888',
        pointBorderColor: '#fff',
        pointStyle: 'circle',
        hoverBorderWidth: 2,
        spanGaps: false,
      }
    ];
    (window as any).evolucionTemporalChart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        locale: 'es',
        plugins: {
          legend: { display: true },
          datalabels: {
            display: true,
            color: (ctx: any) => ctx.dataset.backgroundColor,
            backgroundColor: '#fff',
            borderRadius: 8,
            font: { size: 9, weight: 'bold' },
            anchor: 'end',
            align: 'end',
            padding: { top: 1, bottom: 1, left: 6, right: 6 },
            borderWidth: 1,
            borderColor: (ctx: any) => ctx.dataset.backgroundColor,
            opacity: 0.95,
            clip: true,
            formatter: function(value: any) {
              return value > 0 ? value + '%' : '';
            }
          },
          tooltip: {
            enabled: true,
            callbacks: {
              label: function(context: any) {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                return value > 0 ? `${label}: ${value}%` : '';
              }
            }
          }
        },
        responsive: true,
  layout: { padding: { left: 80, right: 80, top: 10, bottom: 10 } },
        scales: {
          x: {
            title: { display: true, text: 'Año', font: { size: 13 } },
            offset: true // agrega espacio antes del primer y después del último dato
          },
          y: { title: { display: true, text: 'Porcentaje', font: { size: 13 } }, beginAtZero: true, min: 0, max: 100 }
        }
      }
    });
  }

  renderConstruccionChart() {
    const ctx = (document.getElementById('chartConstruccion') as HTMLCanvasElement)?.getContext('2d');
    if (!ctx) return;
    if ((window as any)['chartConstruccionInstance']) {
      (window as any)['chartConstruccionInstance'].destroy();
    }
  const reversedConstruccion = [...this.filteredTblConstruccion].reverse();
  const labels = reversedConstruccion.map(row => row.agno);
    const getOtros = (row: any) =>
      (row.Anulada || 0) + (row.CartaExcusa || 0) + (row.Estudio || 0) + (row.Pendiente || 0) + (row.Postergada || 0);
    const datasets = [
      {
        label: 'Adjudicada',
        data: reversedConstruccion.map(row => row.Adjudicada || 0),
        borderColor: '#39FF14',
        backgroundColor: '#39FF14',
        fill: false,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: '#39FF14',
        pointBorderColor: '#fff',
        pointStyle: 'circle',
        hoverBorderWidth: 2,
        spanGaps: false,
      },
      {
        label: 'Entregada',
        data: reversedConstruccion.map(row => row.Entregada || 0),
        borderColor: '#01b0f1',
        backgroundColor: '#01b0f1',
        fill: false,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: '#01b0f1',
        pointBorderColor: '#fff',
        pointStyle: 'circle',
        hoverBorderWidth: 2,
        spanGaps: false,
      },
      {
        label: 'Perdida',
        data: reversedConstruccion.map(row => row.Perdida || 0),
        borderColor: '#dc3545',
        backgroundColor: '#dc3545',
        fill: false,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: '#dc3545',
        pointBorderColor: '#fff',
        pointStyle: 'circle',
        hoverBorderWidth: 2,
        spanGaps: false,
      },
      {
        label: 'Otros',
        data: reversedConstruccion.map(row => getOtros(row)),
        borderColor: '#888',
        backgroundColor: '#888',
        fill: false,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: '#888',
        pointBorderColor: '#fff',
        pointStyle: 'circle',
        hoverBorderWidth: 2,
        spanGaps: false,
      }
    ];
    (window as any)['chartConstruccionInstance'] = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        locale: 'es',
        plugins: {
          legend: { display: false },
          datalabels: {
            display: true,
            color: (ctx: any) => ctx.dataset.backgroundColor,
            backgroundColor: '#fff',
            borderRadius: 8,
            font: { size: 9, weight: 'bold' },
            anchor: 'end',
            align: 'end',
            padding: { top: 1, bottom: 1, left: 6, right: 6 },
            borderWidth: 1,
            borderColor: (ctx: any) => ctx.dataset.backgroundColor,
            opacity: 0.95,
            clip: true,
            formatter: function(value: any) {
              return value > 0 ? value : '';
            }
          },
          tooltip: {
            enabled: true,
            callbacks: {
              label: function(context: any) {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                const total = context.chart.data.datasets.reduce((sum, ds) => sum + (ds.data[context.dataIndex] || 0), 0);
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return value > 0 ? `${label}: ${value} (${pct}%)` : '';
              }
            }
          }
        },
        responsive: true,
        layout: { padding: { left: 80, right: 80, top: 10, bottom: 10 } },
        scales: {
          x: {
            title: { display: true, text: 'Año', font: { size: 13 } },
            offset: true
          },
          y: { title: { display: true, text: 'Cantidad', font: { size: 13 } }, beginAtZero: true }
        }
      }
    });
  }

  renderArquitecturaChart() {
    const ctx = (document.getElementById('chartArquitectura') as HTMLCanvasElement)?.getContext('2d');
    if (!ctx) return;
    if ((window as any)['chartArquitecturaInstance']) {
      (window as any)['chartArquitecturaInstance'].destroy();
    }
  const reversedArquitectura = [...this.filteredTblArquitectura].reverse();
  const labels = reversedArquitectura.map(row => row.agno);
    const getOtros = (row: any) =>
      (row.Anulada || 0) + (row.CartaExcusa || 0) + (row.Estudio || 0) + (row.Pendiente || 0) + (row.Postergada || 0);
    const datasets = [
      {
        label: 'Adjudicada',
        data: reversedArquitectura.map(row => row.Adjudicada || 0),
        borderColor: '#39FF14',
        backgroundColor: '#39FF14',
        fill: false,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: '#39FF14',
        pointBorderColor: '#fff',
        pointStyle: 'circle',
        hoverBorderWidth: 2,
        spanGaps: false,
      },
      {
        label: 'Entregada',
        data: reversedArquitectura.map(row => row.Entregada || 0),
        borderColor: '#01b0f1',
        backgroundColor: '#01b0f1',
        fill: false,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: '#01b0f1',
        pointBorderColor: '#fff',
        pointStyle: 'circle',
        hoverBorderWidth: 2,
        spanGaps: false,
      },
      {
        label: 'Perdida',
        data: reversedArquitectura.map(row => row.Perdida || 0),
        borderColor: '#dc3545',
        backgroundColor: '#dc3545',
        fill: false,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: '#dc3545',
        pointBorderColor: '#fff',
        pointStyle: 'circle',
        hoverBorderWidth: 2,
        spanGaps: false,
      },
      {
        label: 'Otros',
        data: reversedArquitectura.map(row => getOtros(row)),
        borderColor: '#888',
        backgroundColor: '#888',
        fill: false,
        tension: 0.35,
        borderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 7,
        pointBackgroundColor: '#888',
        pointBorderColor: '#fff',
        pointStyle: 'circle',
        hoverBorderWidth: 2,
        spanGaps: false,
      }
    ];
    (window as any)['chartArquitecturaInstance'] = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        locale: 'es',
        plugins: {
          legend: { display: false },
          datalabels: {
            display: true,
            color: (ctx: any) => ctx.dataset.backgroundColor,
            backgroundColor: '#fff',
            borderRadius: 8,
            font: { size: 9, weight: 'bold' },
            anchor: 'end',
            align: 'end',
            padding: { top: 1, bottom: 1, left: 6, right: 6 },
            borderWidth: 1,
            borderColor: (ctx: any) => ctx.dataset.backgroundColor,
            opacity: 0.95,
            clip: true,
            formatter: function(value: any) {
              return value > 0 ? value : '';
            }
          },
          tooltip: {
            enabled: true,
            callbacks: {
              label: function(context: any) {
                const label = context.dataset.label || '';
                const value = context.parsed.y;
                const total = context.chart.data.datasets.reduce((sum, ds) => sum + (ds.data[context.dataIndex] || 0), 0);
                const pct = total > 0 ? ((value / total) * 100).toFixed(1) : '0';
                return value > 0 ? `${label}: ${value} (${pct}%)` : '';
              }
            }
          }
        },
        responsive: true,
        layout: { padding: { left: 80, right: 80, top: 10, bottom: 10 } },
        scales: {
          x: {
            title: { display: true, text: 'Año', font: { size: 13 } },
            offset: true
          },
          y: { title: { display: true, text: 'Cantidad', font: { size: 13 } }, beginAtZero: true }
        }
      }
    });
  }
  getTotalAdjudicada(): number {
    if (!this.tblLineaAgno) return 0;
    return this.tblLineaAgno.reduce((sum, r) => sum + (r.Adjudicada || 0), 0);
  }
  getTotalEntregada(): number {
    if (!this.tblLineaAgno) return 0;
    return this.tblLineaAgno.reduce((sum, r) => sum + (r.Entregada || 0), 0);
  }
  getTotalPerdida(): number {
    if (!this.tblLineaAgno) return 0;
    return this.tblLineaAgno.reduce((sum, r) => sum + (r.Perdida || 0), 0);
  }
  // Devuelve el año con mayor cantidad para una categoría dada
  getMaxYear(categoria: string): MaxYearResult {
    if (!this.tblLineaAgno || !this.tblLineaAgno.length) return { year: 0, value: 0 };
    let max: MaxYearResult = { year: 0, value: 0 };
    this.tblLineaAgno.forEach((row: any) => {
      if ((row[categoria] || 0) > max.value) {
        max.year = row.agno;
        max.value = row[categoria] || 0;
      }
    });
    return max;
  }
  showStats: boolean = true;
  // ...existing code...
  // Cierra el modal de estadísticas
  closeEstadisticasModal() {
    if (typeof $ !== 'undefined') {
      $('#estadisticasModal').modal('hide');
    }
  }

  // Abre el modal al hacer clic en el gráfico circular (solo una vez)
  ngAfterViewInit() {
    setTimeout(() => {
      this.renderBarChartEstados();
      this.renderBarChartEstadosAnual();
    }, 200);
  }
  // Métodos para calcular el total de cada columna en porcentaje para Construcción
  getTotalConstruccion(col: string): number {
    const total = this.tblConstruccion.reduce((sum, row) => sum + this.getTotalForYear(row), 0);
    if (!total) return 0;
    const colTotal = this.tblConstruccion.reduce((sum, row) => sum + (row[col] || 0), 0);
    return Math.round((colTotal / total) * 100 * 100) / 100; // 2 decimales
  }

  // Métodos para calcular el total de cada columna en porcentaje para Arquitectura
  getTotalArquitectura(col: string): number {
    const total = this.tblArquitectura.reduce((sum, row) => sum + this.getTotalForYear(row), 0);
    if (!total) return 0;
    const colTotal = this.tblArquitectura.reduce((sum, row) => sum + (row[col] || 0), 0);
    return Math.round((colTotal / total) * 100 * 100) / 100; // 2 decimales
  }

  // Historial global: suma total por estado principal
  getGlobalTotals() {
    const global = {
      Adjudicada: 0,
      Perdida: 0,
      Entregada: 0,
      Otros: 0
    };
    if (!this.tblLineaAgno) return global;
    this.tblLineaAgno.forEach(row => {
      global.Adjudicada += row.Adjudicada || 0;
      global.Perdida += row.Perdida || 0;
      global.Entregada += row.Entregada || 0;
      global.Otros += (
        (row.Anulada || 0) +
        (row.CartaExcusa || 0) +
        (row.Estudio || 0) +
        (row.Pendiente || 0) +
        (row.Postergada || 0)
      );
    });
    return global;
  }

  // (Eliminado: función duplicada, la nueva versión ya está implementada abajo)

  urlBase: string = "http://trazas-nbi.com:1234/api/";
  controlador: string = "Reportes/";
  urlFull: string = this.urlBase + this.controlador;

  Areas: any = [];

  //Variables para Graficos
  tblLineaAgno: any;
  tbloftblGraficos: any=[];
  tbloftblGraficosPorcentaje: any =[];

  // Tablas específicas para Construcción y Arquitectura
  tblConstruccion: any[] = [];
  tblArquitectura: any[] = [];

  // Filtros
  circularFilter: any = 'all';
  filteredGlobalTotals: any = {};

  // Variable para almacenar la categoría seleccionada
  selectedCategory: any = null;
  // Variable para controlar la visibilidad del modal
  showCategoryModal: boolean = false;

  // Nueva propiedad para almacenar los datos de las licitaciones
  licitaciones: any[] = [];
  mandantesResumen: { mandante: string, cantidad: number }[] = [];
  mandantesChartData: any[] = [];

  constructor(private http: HttpClient, private ngZone: NgZone) {
  }
  // Loader para mostrar mientras se cargan los datos
  loading: boolean = false;
  areasLoaded: boolean = false;

  ngOnInit() {
    this.loading = true;
    if (typeof $ !== 'undefined') {
      try {
        $.getScript("http://trazas-nbi.com/Bootstrap/ajax-bootstrap4/js/settings.js", function(){});
        $.getScript("http://trazas-nbi.com/Bootstrap/ajax-bootstrap4/js/app.js", function(){});
      } catch (error) {
        console.warn('Error loading external scripts:', error);
      }
    }

    this.initMorris1();
    this.initPieChartEstados();
    // Inicializar los datos filtrados
    this.filteredTblLineaAgno = this.tblLineaAgno;
    this.filteredTblConstruccion = this.tblConstruccion;
    this.filteredTblArquitectura = this.tblArquitectura;
    this.filteredGlobalTotals = this.getFilteredGlobalTotals();
    // Solo cargar áreas si no se han cargado antes
    if (!this.areasLoaded) {
      this.GraficosxArea();
    } else {
      this.loading = false;
    }

    // Inicializar el gráfico circular y su tabla con el filtro por defecto
    setTimeout(() => {
      this.onCircularFilterChange();
    }, 1200);

    // Cargar datos de licitaciones para el resumen de mandantes
    this.http.get<any[]>("http://trazas-nbi.com:1234/api/Licitaciones/GetValuesJoin/join")
      .subscribe(data => {
        this.licitaciones = data;
        this.calcularMandantesResumen();
        // Renderizar todos los gráficos apenas los datos estén listos
        this.renderMandantesBarChart();
        this.updateCharts(); // Actualiza los otros gráficos (línea, construcción, arquitectura)
        this.initGlobalDonutChart();
        this.initMorris3();
        this.initPieChartEstados();
      });
  }
  // Nuevo: filtrar los datos globales para el gráfico circular y su tabla
  getFilteredGlobalTotals() {
    let filtered: any[] = [];
    if (!this.tblLineaAgno) return { Adjudicada: 0, Perdida: 0, Entregada: 0, Otros: 0 };
    if (this.circularFilter === 'all') {
      filtered = this.tblLineaAgno;
    } else {
      const years = this.tblLineaAgno.map(r => r.agno).sort((a, b) => b - a);
      const limit = parseInt(this.circularFilter, 10);
      const selectedYears = years.slice(0, limit);
      filtered = this.tblLineaAgno.filter(r => selectedYears.includes(r.agno));
    }
    const global = { Adjudicada: 0, Perdida: 0, Entregada: 0, Otros: 0 };
    filtered.forEach(row => {
      global.Adjudicada += row.Adjudicada || 0;
      global.Perdida += row.Perdida || 0;
      global.Entregada += row.Entregada || 0;
      global.Otros += (
        (row.Anulada || 0) +
        (row.CartaExcusa || 0) +
        (row.Estudio || 0) +
        (row.Pendiente || 0) +
        (row.Postergada || 0)
      );
    });
    return global;
  }

  onCircularFilterChange() {
    this.filteredGlobalTotals = this.getFilteredGlobalTotals();
    setTimeout(() => {
      this.initGlobalDonutChart();
      this.initMorris3();
      this.renderBarChartEstados();
      this.renderBarChartEstadosAnual();
    }, 0);
  }

  // Actualiza el gráfico donut con los datos filtrados
  initGlobalDonutChart(retryCount: number = 0) {
    const div = document.getElementById('globalBarChart');
    if (!div) {
      if (retryCount < 10) {
        setTimeout(() => this.initGlobalDonutChart(retryCount + 1), 150);
      }
      return;
    }
    // Usar los datos filtrados por el filtro circular
    const global = this.filteredGlobalTotals;
    const total = global.Adjudicada + global.Perdida + global.Entregada + global.Otros;
    const dataPie = [
      { label: 'Adjudicada', value: global.Adjudicada },
      { label: 'Perdida', value: global.Perdida },
      { label: 'Entregada', value: global.Entregada },
      { label: 'Otros', value: global.Otros }
    ];
    // Validar datos antes de renderizar
    if (!dataPie.length || dataPie.every(d => !d.value || isNaN(d.value))) {
      // No renderizar si no hay datos válidos
      return;
    }
    if (document.getElementById('globalBarChart')) {
      Morris.Donut({
        element: 'globalBarChart',
        data: dataPie,
        colors: ['#39FF14', '#dc3545', '#01b0f1', '#888'], // Verde fosforescente para Adjudicada
        resize: true,
        formatter: function (y: any, data: any) {
          const percentage = total > 0 ? Math.round((y / total) * 100) : 0;
          return y + ' (' + percentage + '%)';
        }
      });
    } else {
      console.warn("El div con id 'globalBarChart' no existe en el DOM.");
    }
  }
  // Inicializa el gráfico torta de Adjudicadas, Perdidas y Otros
  initPieChartEstados() {
    this.http.get<any[]>(this.urlFull + 'GetLicxEstado/lic=1')
      .subscribe(Grafico => {
        // Agrupar los datos
        let adjudicada = 0;
        let perdida = 0;
        let otros = 0;
        Grafico.forEach(item => {
          if (item.label === 'Adjudicada') {
            adjudicada += item.value;
          } else if (item.label === 'Perdida') {
            perdida += item.value;
          } else {
            otros += item.value;
          }
        });
        const total = adjudicada + perdida + otros;
        const dataPie = [
          { label: 'Adjudicada', value: adjudicada },
          { label: 'Perdida', value: perdida },
          { label: 'Otros', value: otros },
          { label: 'Total (100%)', value: total }
        ];
        if (document.getElementById('pieChartEstados')) {
          Morris.Donut({
            element: 'pieChartEstados',
            data: dataPie,
            colors: ['#57faa0', '#dc3545', '#888', '#026AA7'],
            resize: true,
            formatter: function (y: any, data: any) {
              const percentage = total > 0 ? Math.round((y / total) * 100) : 0;
              return y + ' (' + percentage + '%)';
            }
          });
        } else {
          console.warn("El div con id 'pieChartEstados' no existe en el DOM.");
        }
      });
  }

  // Función para calcular el total de licitaciones por año
  getTotalForYear(repo: any): number {
    return repo.Adjudicada + repo.Anulada + repo.CartaExcusa + repo.Entregada + 
           repo.Estudio + repo.Pendiente + repo.Perdida + repo.Postergada;
  }

  // Función para calcular el total de licitaciones por área y año
  getTotalForAreaYear(repo: any): number {
    return repo.Adjudicada + repo.Pendiente + repo.Perdida;
  }

  initMorris3() {
    // Usar los datos filtrados por el filtro circular
    const tryRenderDonut = (retries = 0) => {
      const el = document.getElementById('morris3');
      if (!el) {
        if (retries < 20) {
          setTimeout(() => tryRenderDonut(retries + 1), 150);
        }
        return;
      }
      $('#morris3').css({ height: 260 });
      // Tomar los datos filtrados
      const global = this.filteredGlobalTotals;
      // Sumar Entregada dentro de Otros
      const otrosConEntregada = (global.Otros || 0) + (global.Entregada || 0);
      const total = global.Adjudicada + global.Perdida + otrosConEntregada;
      const dataPie = [
        { label: 'Adjudicada', value: global.Adjudicada },
        { label: 'Perdida', value: global.Perdida },
        { label: 'Otros', value: otrosConEntregada }
      ];
      // Validar datos antes de renderizar
      if (!dataPie.length || dataPie.every(d => !d.value || isNaN(d.value))) {
        // No renderizar si no hay datos válidos
        return;
      }
      Morris.Donut({
        element: 'morris3',
        data: dataPie,
  colors: ['#39FF14', '#dc3545', '#888'],
        resize: true,
        formatter: function (y: any, data: any) {
          const percentage = total > 0 ? Math.round((y / total) * 100) : 0;
          return y + ' (' + percentage + '%)';
        }
      });
    };
    tryRenderDonut();
  }

  // Método para cerrar el modal
  closeCategoryModal() {
    this.showCategoryModal = false;
    this.selectedCategory = null;
  }

  initMorris1() {
    this.http.get<any[]>(this.urlFull + 'GetLicxAgnoxEstado/lic=1')
      .subscribe(Grafico => {
        // Sort data by year (agno) ascending
        const sortedGrafico = [...Grafico].sort((a, b) => a.agno - b.agno);
        this.tblLineaAgno = sortedGrafico;
        this.filteredTblLineaAgno = this.filterByYear(this.tblLineaAgno);
        this.renderEvolucionTemporalChart();
      });
  }

  GraficosxArea() {
    let loc = this;
    this.http.get<any[]>(this.urlBase + 'Area/')
      .subscribe(Areas => {
        loc.Areas = Areas;
        let totalAreas = Areas.length;
        let loadedAreas = 0;
        Areas.forEach(element => {
          // Si ya existe el gráfico para el área, no volver a cargar
          if (loc.tbloftblGraficos[element.IdArea]) {
            loadedAreas++;
            if (loadedAreas === totalAreas) {
              loc.loading = false;
              loc.areasLoaded = true;
            }
            return;
          }
          loc.http.get<any[]>(this.urlFull + 'GetLicxAgnoxEstadoByIdArea/IdArea=' + element.IdArea)
            .subscribe(Grafico => {
              loc.tbloftblGraficos[element.IdArea]=Grafico;
              // Chart.js área con etiquetas tipo badge
              const estados = ['Adjudicada', 'Anulada', 'CartaExcusa', 'Entregada', 'Estudio', 'Pendiente', 'Perdida', 'Postergada'];
              const colors = ['#008000', '#6c757d', '#ffc107', '#e83e8c', '#17a2b8', '#ffd700', '#dc3545', '#6f42c1'];
              // Obtener todos los años únicos del rango
              const allYears = Array.from(new Set(Grafico.map(row => row.agno))).sort((a, b) => a - b);
              const minYear = Math.min(...allYears);
              const maxYear = Math.max(...allYears);
              const fullYears = [];
              for (let y = minYear; y <= maxYear; y++) {
                fullYears.push(y);
              }
              // Construir datos completos para cada año
              const completeGrafico = fullYears.map(year => {
                const found = Grafico.find(row => row.agno === year);
                if (found) return found;
                // Si no existe, crear fila con valores en cero
                const emptyRow = { agno: year };
                estados.forEach(e => { emptyRow[e] = 0; });
                return emptyRow;
              });
              let canvasId = '';
              let areaLabels;
              let areaSourceData;
              let areaDatasets;
              // Asignar canvasId antes de cualquier uso
              if (element.NombreArea && element.NombreArea.toLowerCase().includes('constru')) {
                canvasId = 'chartConstruccion';
              } else if (element.NombreArea && element.NombreArea.toLowerCase().includes('arquitect')) {
                canvasId = 'chartArquitectura';
              }
              if (canvasId === 'chartConstruccion') {
                areaSourceData = [...loc.tblConstruccion];
              } else if (canvasId === 'chartArquitectura') {
                areaSourceData = [...loc.tblArquitectura];
              } else {
                areaSourceData = [...completeGrafico];
              }
              areaLabels = areaSourceData.map(row => row.agno);
              areaDatasets = estados.map((estado, i) => ({
                label: estado,
                data: areaSourceData.map(row => typeof row[estado] === 'number' ? row[estado] : 0),
                borderColor: colors[i],
                backgroundColor: colors[i],
                fill: false,
                tension: 0.35,
                borderWidth: 2,
                pointRadius: 4,
                pointHoverRadius: 7,
                pointBackgroundColor: colors[i],
                pointBorderColor: '#fff',
                pointStyle: 'circle',
                hoverBorderWidth: 2,
                spanGaps: false,
                order: i + 1
              }));
              if (canvasId) {
                const ctx = (document.getElementById(canvasId) as HTMLCanvasElement)?.getContext('2d');
                if (ctx) {
                  if ((window as any)[canvasId+'Instance']) {
                    (window as any)[canvasId+'Instance'].destroy();
                  }
                  (window as any)[canvasId+'Instance'] = new Chart(ctx, {
                    type: 'line',
                    data: {
                      labels: areaLabels,
                      datasets: areaDatasets
                    },
                    options: {
                      plugins: {
                        legend: {
                          display: false
                        },
                        datalabels: {
                          display: 'auto', // Solo mostrar la etiqueta al pasar el mouse
                          color: '#fff',
                          backgroundColor: (ctx: any) => ctx.dataset.backgroundColor + 'CC',
                          borderRadius: 8,
                          font: {
                            size: 8,
                            weight: 'bold'
                          },
                          anchor: 'end',
                          align: 'end',
                          padding: {
                            top: 1, bottom: 1, left: 6, right: 6
                          },
                          borderWidth: 0,
                          opacity: 0.85,
                          clip: true,
                          formatter: function(value: any, context: any) {
                            return context.active ? value : '';
                          }
                        },
                        tooltip: {
                          enabled: true,
                          callbacks: {
                            label: function(context: any) {
                              const label = context.dataset.label || '';
                              const value = context.parsed.y;
                              return label + ': ' + value;
                            }
                          }
                        }
                      },
                      responsive: true,
                      scales: {
                        x: {
                          title: {
                            display: true,
                            text: 'Año',
                            font: { size: 13 }
                          }
                        },
                        y: {
                          title: {
                            display: true,
                            text: 'Cantidad',
                            font: { size: 13 }
                          },
                          beginAtZero: true
                        }
                      }
                    }
                  });
                }
              }

              // Poblar tabla de Construcción y Arquitectura
              // Estados completos para asegurar que todos estén presentes y mantener los valores reales
              const estadosCompletos = [
                'Adjudicada', 'Anulada', 'CartaExcusa', 'Entregada', 'Estudio', 'Pendiente', 'Perdida', 'Postergada'
              ];
              function completarFila(row) {
                // Copiar todos los valores reales del row
                const fila = { agno: row.agno };
                estadosCompletos.forEach(e => {
                  // Si el valor existe y es numérico, mantenerlo; si no, poner cero
                  fila[e] = (row[e] !== undefined && row[e] !== null && !isNaN(row[e])) ? row[e] : 0;
                });
                return fila;
              }
              if (element.NombreArea && element.NombreArea.toLowerCase().includes('constru')) {
                loc.tblConstruccion = Grafico.map(row => completarFila(row));
                loc.filteredTblConstruccion = loc.filterByYear(loc.tblConstruccion);
                loc.renderConstruccionChart();
              }
              if (element.NombreArea && element.NombreArea.toLowerCase().includes('arquitect')) {
                loc.tblArquitectura = Grafico.map(row => completarFila(row));
                loc.filteredTblArquitectura = loc.filterByYear(loc.tblArquitectura);
                loc.renderArquitecturaChart();
              }
              loadedAreas++;
              if (loadedAreas === totalAreas) {
                loc.loading = false;
                loc.areasLoaded = true;
              }
            });

            /********************** Porcentajes ********************/
            loc.http.get<any[]>(this.urlFull + 'GetLicxAgnoxEstadoByIdAreaPorcentaje/IdArea=' + element.IdArea)
            .subscribe(Grafico => {
              loc.tbloftblGraficosPorcentaje[element.IdArea]=Grafico;
            });
        });
      });
  }

  calcularMandantesResumen() {
    if (!this.licitaciones) return;
    const resumen: { [mandante: string]: number } = {};
    this.licitaciones.forEach(l => {
      const mandante = l.NombreMandante || 'Sin Mandante';
      resumen[mandante] = (resumen[mandante] || 0) + 1;
    });
    this.mandantesResumen = Object.entries(resumen).map(([mandante, cantidad]) => ({ mandante, cantidad }));
    this.mandantesChartData = this.mandantesResumen.map(m => ({ label: m.mandante, value: m.cantidad }));
  }

  renderMandantesChart() {
    const div = document.getElementById('mandantesChart');
    if (!div) return;
    if ((window as any).mandantesChartInstance) {
      (window as any).mandantesChartInstance = null;
      div.innerHTML = '';
    }
    if (!this.mandantesChartData.length) return;
    Morris.Donut({
      element: 'mandantesChart',
      data: this.mandantesChartData,
      colors: ['#01b0f1', '#ffd700', '#dc3545', '#39FF14', '#888', '#FF59D6', '#ff8c00', '#333333'],
      resize: true,
      formatter: function (y: any, data: any) {
        return y;
      }
    });
  }

  renderMandantesBarChart() {
    const ctx = (document.getElementById('mandantesBarChart') as HTMLCanvasElement)?.getContext('2d');
    if (!ctx) return;
    if ((window as any).mandantesBarChartInstance) {
      (window as any).mandantesBarChartInstance.destroy();
    }
    // Ordenar mandantes de mayor a menor cantidad
    const sorted = [...this.mandantesResumen].sort((a, b) => b.cantidad - a.cantidad);
    const labels = sorted.map(m => m.mandante);
    const data = sorted.map(m => m.cantidad);
    const total = data.reduce((sum, v) => sum + v, 0);
    // Azul corporativo
    const color = '#1976d2';
    (window as any).mandantesBarChartInstance = new Chart(ctx, {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Cantidad de licitaciones',
          data,
          backgroundColor: color,
          borderColor: color,
          borderWidth: 1.5,
          maxBarThickness: 48,
          minBarLength: 8
        }]
      },
      options: {
        indexAxis: 'x', // Barras verticales
        plugins: {
          legend: { display: false },
          datalabels: { display: false },
          tooltip: {
            enabled: true,
            callbacks: {
              label: function(context: any) {
                const value = context.parsed.y;
                const pct = total ? ((value / total) * 100).toFixed(1) : '0';
                return `${value} licitaciones (${pct}%)`;
              }
            }
          }
        },
        responsive: true,
        layout: { padding: { left: 10, right: 10, top: 10, bottom: 10 } },
        scales: {
          x: {
            title: { display: true, text: 'Mandante', font: { size: 14, weight: 'bold' }, color: '#444' },
            grid: { color: '#f3f3f3' },
            ticks: { font: { size: 12 }, color: '#444' }
          },
          y: {
            title: { display: true, text: 'Cantidad', font: { size: 14, weight: 'bold' }, color: '#444' },
            beginAtZero: true,
            grid: { color: '#f3f3f3' },
            ticks: { font: { size: 12 }, color: '#444' }
          }
        }
      }
    });
  }

  getTotalMandantes(): number {
    return this.mandantesResumen.reduce((sum, m) => sum + m.cantidad, 0);
  }

  mandantesPageSize: number = 10;
mandantesCurrentPage: number = 1;
get mandantesTotalPages(): number {
  return Math.ceil(this.mandantesResumen.length / this.mandantesPageSize);
}
get mandantesPagedResumen() {
  const start = (this.mandantesCurrentPage - 1) * this.mandantesPageSize;
  return this.mandantesResumen.slice(start, start + this.mandantesPageSize);
}
get mandantesSortedPagedResumen() {
  const sorted = [...this.mandantesResumen].sort((a, b) => b.cantidad - a.cantidad);
  const start = (this.mandantesCurrentPage - 1) * this.mandantesPageSize;
  return sorted.slice(start, start + this.mandantesPageSize);
}
mandantesGoToPage(page: number) {
  if (page >= 1 && page <= this.mandantesTotalPages) {
    this.mandantesCurrentPage = page;
  }
}
mandantesNextPage() {
  if (this.mandantesCurrentPage < this.mandantesTotalPages) {
    this.mandantesCurrentPage++;
  }
}
mandantesPrevPage() {
  if (this.mandantesCurrentPage > 1) {
    this.mandantesCurrentPage--;
  }
}
getTotalPrincipal(): number {
  // Si la tabla principal es tblLineaAgno, sumar todos los valores relevantes
  if (!this.tblLineaAgno) return 0;
  return this.tblLineaAgno.reduce((sum, r) => sum + this.getTotalForYear(r), 0);
}}