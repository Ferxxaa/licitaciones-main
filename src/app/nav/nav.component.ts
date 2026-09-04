import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

declare var $: any;
declare var jQuery: any;

@Component({
  selector: 'app-nav',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './nav.component.html',
  styleUrls: ['./nav.component.css']
})
export class NavComponent implements OnInit, AfterViewInit, OnDestroy {
      public esHome: boolean = false;
      public showHome: boolean = false;

  private sidebarMouseLeaveHandler?: (e: MouseEvent) => void;

  // Submenús internos (collapses) manejados por Angular
  private openSubmenus = new Set<string>();
    // Variables para despliegue de títulos principales
    public showUsuarios = false;
    public showLicitaciones = false;
    public showTareas = false;
    public showFinanzas = false;
    public showProyectos = false;
    public showAdmin = false;

    public toggleSection(section: string) {
      const isCurrentlyOpen = this.getSectionState(section);

      // Cerrar cualquier otro bloque o submenú antes de abrir el nuevo
      this.closeSectionsExcept(section);

      // Abrir/cerrar el que se clickeó
      this.setSectionState(section, !isCurrentlyOpen);
    }

    private closeSectionsExcept(sectionToKeep: string) {
      const keepHomeOpen = sectionToKeep === 'home' || sectionToKeep === 'administracion';

      if (sectionToKeep !== 'usuarios') this.showUsuarios = false;
      if (sectionToKeep !== 'licitaciones') this.showLicitaciones = false;
      if (sectionToKeep !== 'tareas') this.showTareas = false;
      if (sectionToKeep !== 'finanzas') this.showFinanzas = false;
      if (sectionToKeep !== 'proyectos') this.showProyectos = false;
      if (!keepHomeOpen) this.showHome = false;
      if (sectionToKeep !== 'administracion') this.showAdmin = false;

      // Asegurar que solo quede abierto el submenú seleccionado
      this.closeAllCollapses();
    }

    private closeAllCollapses() {
      // Cerrar submenús manejados por Angular
      this.openSubmenus.clear();

      // No tocar los collapses manejados por Angular; solo cerrar los de Bootstrap/jQuery
      const openCollapses = document.querySelectorAll('.collapse.show:not(.ng-managed-collapse)');
      openCollapses.forEach(el => {
        el.classList.remove('show');
        el.setAttribute('aria-expanded', 'false');
      });

      const openButtons = document.querySelectorAll('[data-toggle="collapse"][aria-expanded="true"]');
      openButtons.forEach(btn => btn.setAttribute('aria-expanded', 'false'));
    }

    isSubmenuOpen(id: string): boolean {
      return this.openSubmenus.has(id);
    }

    toggleSubmenu(id: string, event?: Event) {
      if (event) {
        event.preventDefault();
        event.stopPropagation();
      }

      if (this.openSubmenus.has(id)) {
        this.openSubmenus.delete(id);
      } else {
        this.openSubmenus.add(id);
      }
    }

    private getSectionState(section: string): boolean {
      switch (section) {
        case 'usuarios': return this.showUsuarios;
        case 'licitaciones': return this.showLicitaciones;
        case 'tareas': return this.showTareas;
        case 'finanzas': return this.showFinanzas;
        case 'proyectos': return this.showProyectos;
        case 'home': return this.showHome;
        case 'administracion': return this.showAdmin;
        default: return false;
      }
    }

    private setSectionState(section: string, isOpen: boolean) {
      switch (section) {
        case 'usuarios': this.showUsuarios = isOpen; break;
        case 'licitaciones': this.showLicitaciones = isOpen; break;
        case 'tareas': this.showTareas = isOpen; break;
        case 'finanzas': this.showFinanzas = isOpen; break;
        case 'proyectos': this.showProyectos = isOpen; break;
        case 'home': this.showHome = isOpen; break;
        case 'administracion': this.showAdmin = isOpen; break;
        default: break;
      }
    }
  // Método para compatibilidad con el template
  interno(): boolean {
    // Ajusta la lógica según tu necesidad
    return true;
  }
  // Notificaciones y usuario (copiado de proyectos)
  notificacionSeleccionada: any = null;
  conteoNotificaciones: number = 0;
  mostrarNotificaciones: boolean = false;
  notificacionesUsuario: any[] = [];
  notificacionesVistas: Set<number> = new Set();
  date: any = new Date();

  // Métodos mínimos para compatibilidad con el nav copiado
  toggleNotificaciones() {
    this.mostrarNotificaciones = !this.mostrarNotificaciones;
  }

  marcarTodasComoLeidas() {
    this.notificacionesUsuario.forEach(notif => {
      notif.leida = true;
      this.notificacionesVistas.add(notif.id);
    });
    this.conteoNotificaciones = 0;
  }

  irANotificaciones() {
    this.router.navigate(['/notificaciones']);
  }

  CerrarSesion() {
    localStorage.removeItem("usuario");
    this.router.navigate(['/Login']);
  }

  obtenerIconoTipo(tipo: string): string {
    switch (tipo) {
      case 'tarea': return 'fa-tasks';
      case 'proyecto': return 'fa-folder-open';
      case 'reunion': return 'fa-calendar';
      case 'vencimiento': return 'fa-clock-o';
      case 'ritmo': return 'fa-tachometer';
      case 'validacion': return 'fa-exclamation-triangle';
      case 'licitacion': return 'fa-gavel';
      case 'bitacora': return 'fa-file-text';
      default: return 'fa-bell';
    }
  }

  estaVencida(notif: any): boolean {
    if (!notif.fechaCompromiso) return false;
    return new Date(notif.fechaCompromiso) < new Date();
  }

  diasHastaVencimiento(notif: any): number {
    if (!notif.fechaCompromiso) return 0;
    const ahora = new Date();
    const vencimiento = new Date(notif.fechaCompromiso);
    const diferencia = vencimiento.getTime() - ahora.getTime();
    return Math.ceil(diferencia / (1000 * 60 * 60 * 24));
  }

  public sidebarOpen: boolean = false;

  public toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;

    // Si el nav se está cerrando, cerrar todos los submenús abiertos
    if (!this.sidebarOpen) {
      this.closeAllMenus();
    }
    // Evitar scroll del body cuando el menú está abierto en móvil
    if (this.sidebarOpen && window.innerWidth <= 991) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }

  //Perfiles
  Sistema: boolean = false;

  //Proyectos
  DirectorProy: boolean = false;
  CoordinadorProy: boolean = false;
  SubGerenteProy: boolean = false;
  Seguridad: boolean = false;
  
  //Licitaciones
  DirectorLic: boolean;
  CoordinadorLic: boolean;

  //Finanzas
  Administracion: boolean;
  GerenteAdmin: boolean;

  usuario: any = {};
  perfiles: any = [];
  activeMenuItem: string = ''; // Trackear el elemento activo del menú

  urlBase: string = 'http://trazas-nbi.com:1234/api/'
  controlador: string = 'UsuariosPerfiles/'
  urlFull: string = this.urlBase + this.controlador

  constructor(private http: HttpClient, private router: Router) { 

    this.Sistema = false;
    this.DirectorProy = false;
    this.CoordinadorProy = false;
    this.SubGerenteProy = false;
    this.Seguridad = false;
    this.DirectorLic = false;
    this.CoordinadorLic = false;
    this.Administracion = false;
    this.GerenteAdmin = false;

  }

  ngOnInit() {
    // Detectar si la ruta actual es Home y cambiar color del nav
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        const url = event.urlAfterRedirects;
        this.esHome = url === '/Home' || url === '/home' || url === '' || url === '/';
      }
    });

    // Cargar perfiles y roles del usuario
    this.loadUserProfile();
  }

  ngAfterViewInit() {
    // Inicializar funcionalidades del menú después de que la vista esté cargada
    setTimeout(() => {
      this.initializeMenuFunctionality();
      this.restoreActiveMenuItem();
    }, 200);

    // Cuando el sidebar se “cierra” (deja de estar hover), cerrar submenús Angular
    const sidebarEl = document.getElementById('sidebar');
    if (sidebarEl) {
      this.sidebarMouseLeaveHandler = () => {
        this.closeAllMenus();
      };
      sidebarEl.addEventListener('mouseleave', this.sidebarMouseLeaveHandler);
    }
  }

  private closeAllMenus() {
    // Cerrar secciones principales
    this.showUsuarios = false;
    this.showLicitaciones = false;
    this.showTareas = false;
    this.showFinanzas = false;
    this.showProyectos = false;
    this.showHome = false;
    this.showAdmin = false;

    // Cerrar submenús internos manejados por Angular
    this.openSubmenus.clear();

    // Cerrar collapses manejados por Bootstrap/jQuery
    this.closeAllCollapses();
  }

  private restoreActiveMenuItem() {
    // Restaurar el elemento activo desde localStorage
    const savedActiveItem = localStorage.getItem('activeMenuItem');
    
    if (savedActiveItem) {
      // Buscar el elemento del menú que coincida con el texto guardado
      if (typeof $ !== 'undefined') {
        $('.sidebar-nav a').each(function() {
          const menuText = $(this).text().trim();
          if (menuText === savedActiveItem) {
            $(this).addClass('active');
            console.log('Restored active menu item:', menuText);
            return false; // Break the loop
          }
        });
      } else {
        // Implementación nativa
        const menuLinks = document.querySelectorAll('.sidebar-nav a');
        menuLinks.forEach(link => {
          const menuText = link.textContent?.trim() || '';
          if (menuText === savedActiveItem) {
            link.classList.add('active');
            console.log('Restored active menu item (native):', menuText);
          }
        });
      }
    }
  }

  private initializeMenuFunctionality() {
    if (typeof $ !== 'undefined') {
      console.log('Initializing menu functionality with jQuery');
      
      // Limpiar TODOS los event handlers existentes para prevenir duplicación
      $('[data-toggle="collapse"]').off('click');
      $('.sidebar-nav a').off('click');
      
      // Usar delegación de eventos para todos los enlaces del menú
      $(document).off('click.nav-menu', '.sidebar-nav a');
      $(document).on('click.nav-menu', '.sidebar-nav a', function(e) {
        const $this = $(this);
        const isCollapseButton = $this.attr('data-toggle') === 'collapse';
        const hasClickHandler = $this.attr('(click)') || $this.attr('ng-click');
        
        // Si tiene data-toggle="collapse", manejar el collapse
        if (isCollapseButton) {
          e.preventDefault();
          e.stopImmediatePropagation();
          
          // Evitar clicks múltiples durante animación
          if ($this.hasClass('animating')) {
            return false;
          }
          
          const target = $this.attr('href');
          
          console.log('Menu collapse triggered for:', target);
          
          if (target && target.startsWith('#')) {
            const $target = $(target);
            
            if ($target.length > 0) {
              const isExpanded = $target.hasClass('show');
              
              // Marcar como animando
              $this.addClass('animating');
              
              if (isExpanded) {
                // Cerrar el menú actual
                $target.removeClass('show');
                $this.attr('aria-expanded', 'false');
                $target.attr('aria-expanded', 'false');
                
                // Remover clase animating después de la transición
                setTimeout(() => {
                  $this.removeClass('animating');
                }, 300);
              } else {
                // Cerrar otros menús abiertos primero (sin tocar submenús controlados por Angular)
                $('.collapse.show').not('.ng-managed-collapse').removeClass('show');
                $('[data-toggle="collapse"][aria-expanded="true"]').attr('aria-expanded', 'false');
                $('.collapse[aria-expanded="true"]').not('.ng-managed-collapse').attr('aria-expanded', 'false');
                
                // Abrir el menú clickeado
                setTimeout(() => {
                  $target.addClass('show');
                  $this.attr('aria-expanded', 'true');
                  $target.attr('aria-expanded', 'true');
                  
                  // Remover clase animando
                  setTimeout(() => {
                    $this.removeClass('animating');
                  }, 300);
                }, 50);
              }
            } else {
              $this.removeClass('animating');
            }
          } else {
            $this.removeClass('animating');
          }
          
          return false;
        } 
        // Si es un enlace con Angular click handler o href
        else if (hasClickHandler || $this.attr('href')) {
          // Evitar animación múltiple
          if ($this.hasClass('animating')) {
            return false;
          }
          
          // Remover clase active de otros elementos
          $('.sidebar-nav a.active').removeClass('active');
          
          // Añadir indicador visual para navegación
          $this.addClass('animating');
          
          // Después de la animación, marcar como activo permanentemente
          setTimeout(() => {
            $this.removeClass('animating');
            $this.addClass('active');
            
            // Guardar el elemento activo para persistencia
            const menuText = $this.text().trim();
            localStorage.setItem('activeMenuItem', menuText);
            console.log('Active menu item set to:', menuText);
          }, 600);
          
          // Permitir que el evento continue normalmente
          console.log('Navigation triggered for:', $this.text().trim());
        }
      });

      // Manejar estados hover para todos los enlaces del sidebar
      $(document).off('mouseenter.nav-hover mouseleave.nav-hover', '.sidebar-nav a');
      $(document).on('mouseenter.nav-hover', '.sidebar-nav a', function() {
        if (!$(this).hasClass('animating')) {
          $(this).addClass('hover');
        }
      }).on('mouseleave.nav-hover', '.sidebar-nav a', function() {
        $(this).removeClass('hover');
      });

      // Auto-cerrar menús cuando el mouse salga del área del sidebar
      $(document).off('mouseleave.nav-sidebar', '.sidebar-nav');
      $(document).on('mouseleave.nav-sidebar', '.sidebar-nav', function(e) {
        // Delay para permitir que el usuario se mueva entre elementos del menú
        setTimeout(() => {
          // Verificar si el mouse sigue fuera del sidebar
          const mouseX = e.originalEvent?.clientX || 0;
          const mouseY = e.originalEvent?.clientY || 0;
          const sidebarElement = document.querySelector('.sidebar-nav');
          
          if (sidebarElement) {
            const rect = sidebarElement.getBoundingClientRect();
            const isOutside = mouseX < rect.left || mouseX > rect.right || 
                            mouseY < rect.top || mouseY > rect.bottom;
            
            if (isOutside) {
              // Cerrar todos los menús abiertos
              $('.collapse.show').not('.ng-managed-collapse').removeClass('show');
              $('[data-toggle="collapse"][aria-expanded="true"]').attr('aria-expanded', 'false');
              $('.collapse[aria-expanded="true"]').not('.ng-managed-collapse').attr('aria-expanded', 'false');
              console.log('Auto-closing menus on mouse leave');
            }
          }
        }, 300); // 300ms delay
      });

      console.log('jQuery navigation handlers initialized with event delegation for all menu items');

    } else {
      console.warn('jQuery not available, using native implementation');
      this.initializeNativeMenuFunctionality();
    }
  }

  private initializeNativeMenuFunctionality() {
    console.log('Initializing native menu functionality');
    
    // Limpiar todos los event listeners existentes primero
    document.removeEventListener('click', this.handleDocumentClick);
    document.removeEventListener('mouseleave', this.handleSidebarMouseLeave);
    
    // Usar delegación de eventos a nivel documento para evitar duplicación
    document.addEventListener('click', this.handleDocumentClick.bind(this));
    
    // Auto-cerrar menús cuando el mouse salga del sidebar
    const sidebarNav = document.querySelector('.sidebar-nav');
    if (sidebarNav) {
      sidebarNav.addEventListener('mouseleave', this.handleSidebarMouseLeave.bind(this));
    }
  }

  private handleDocumentClick = (e: Event) => {
    const target = e.target as HTMLElement;
    const menuLink = target.closest('.sidebar-nav a') as HTMLElement;
    
    if (menuLink) {
      const isCollapseButton = menuLink.getAttribute('data-toggle') === 'collapse';
      
      if (isCollapseButton) {
        e.preventDefault();
        e.stopImmediatePropagation();
        
        // Evitar clicks múltiples durante animación
        if (menuLink.classList.contains('animating')) {
          return;
        }
        
        const href = menuLink.getAttribute('href');
        
        console.log('Native collapse handler triggered for:', href);
        
        if (href && href.startsWith('#')) {
          const targetElement = document.querySelector(href);
          if (targetElement) {
            const isExpanded = targetElement.classList.contains('show');
            
            // Marcar como animando
            menuLink.classList.add('animating');
            
            if (isExpanded) {
              // Cerrar el menú actual
              targetElement.classList.remove('show');
              targetElement.setAttribute('aria-expanded', 'false');
              menuLink.setAttribute('aria-expanded', 'false');
              
              setTimeout(() => {
                menuLink.classList.remove('animating');
              }, 300);
            } else {
              // Cerrar otros menús abiertos primero
              const openCollapse = document.querySelectorAll('.collapse.show:not(.ng-managed-collapse)');
              openCollapse.forEach(el => {
                el.classList.remove('show');
                el.setAttribute('aria-expanded', 'false');
              });
              
              const openButtons = document.querySelectorAll('[data-toggle="collapse"][aria-expanded="true"]');
              openButtons.forEach(btn => {
                btn.setAttribute('aria-expanded', 'false');
              });
              
              // Abrir el menú clickeado
              targetElement.classList.add('show');
              targetElement.setAttribute('aria-expanded', 'true');
              menuLink.setAttribute('aria-expanded', 'true');
              
              setTimeout(() => {
                menuLink.classList.remove('animating');
              }, 300);
            }
          } else {
            menuLink.classList.remove('animating');
          }
        } else {
          menuLink.classList.remove('animating');
        }
      } else {
        // Para otros enlaces del menú, añadir indicador visual
        if (!menuLink.classList.contains('animating')) {
          // Remover clase active de otros elementos
          const activeElements = document.querySelectorAll('.sidebar-nav a.active');
          activeElements.forEach(el => el.classList.remove('active'));
          
          menuLink.classList.add('animating');
          
          setTimeout(() => {
            menuLink.classList.remove('animating');
            menuLink.classList.add('active');
            
            // Guardar el elemento activo para persistencia
            const menuText = menuLink.textContent?.trim() || '';
            localStorage.setItem('activeMenuItem', menuText);
            console.log('Active menu item set to:', menuText);
          }, 600);
          
          console.log('Navigation triggered for:', menuLink.textContent?.trim());
        }
      }
    }
  }

  private handleSidebarMouseLeave = (e: MouseEvent) => {
    // Delay para permitir que el usuario se mueva entre elementos del menú
    setTimeout(() => {
      // Verificar si el mouse sigue fuera del sidebar
      const sidebarElement = document.querySelector('.sidebar-nav');
      
      if (sidebarElement) {
        const rect = sidebarElement.getBoundingClientRect();
        const isOutside = e.clientX < rect.left || e.clientX > rect.right || 
                        e.clientY < rect.top || e.clientY > rect.bottom;
        
        if (isOutside) {
          // Cerrar todos los menús abiertos
          const openCollapse = document.querySelectorAll('.collapse.show:not(.ng-managed-collapse)');
          openCollapse.forEach(el => {
            el.classList.remove('show');
            el.setAttribute('aria-expanded', 'false');
          });
          
          const openButtons = document.querySelectorAll('[data-toggle="collapse"][aria-expanded="true"]');
          openButtons.forEach(btn => {
            btn.setAttribute('aria-expanded', 'false');
          });
          
          console.log('Auto-closing menus on mouse leave (native)');
        }
      }
    }, 300); // 300ms delay
  }

  private loadUserProfile() {

    if (!localStorage.hasOwnProperty('usuario')) {
      console.log("usuario no logueado");
    } else {
      try {
        this.usuario = JSON.parse(localStorage['usuario']);
        this.http.get(this.urlFull + 'GetUsuariosPerfilesByIdUsuario/IdUsuario=' + this.usuario.idUsuario)
          .subscribe({
            next: (data: any) => {
              data.forEach((element: any) => {
                if (element.idPerfil == 3) this.CoordinadorProy = true;
                if (element.idPerfil == 2) this.DirectorProy = true;
              if (element.idPerfil == 1) this.SubGerenteProy = true;
              if (element.idPerfil == 4) this.Sistema = true;
                if (element.idPerfil == 7) this.DirectorLic = true;
                if (element.idPerfil == 8) this.CoordinadorLic = true;
                if (element.idPerfil == 9) this.Seguridad = true;
                if (element.idPerfil == 10) this.Administracion = true;
                if (element.idPerfil == 11) this.GerenteAdmin = true;
              });
              // NO reinicializar menú aquí para evitar duplicación de eventos
              // setTimeout(() => {
              //   this.initializeMenuFunctionality();
              // }, 50);
            },
            error: (err: any) => {
              console.log(err.message);
            }
          });
      } catch (err: any) {
        console.log(err.message);
      }
    }
  }

  Areas() {
    this.setActiveMenuItem('Areas');
    this.router.navigate(['/Licitacion-Areas']);
  }

  Mandantes() {
    this.setActiveMenuItem('Mandantes');
    this.router.navigate(['/Licitacion-Mandantes']);
  }

  Ejecutivos() {
    this.setActiveMenuItem('Ejecutivos');
    this.router.navigate(['/Licitacion-Ejecutivos']);
  }

  Hitos() {
    this.setActiveMenuItem('Hitos');
    this.router.navigate(['/Licitacion-Hitos']);
  }

  Licitaciones() {
    this.setActiveMenuItem('Licitaciones');
    this.router.navigate(['/Licitacion-Agregar']);
  }

  MisLicitaciones() {
    this.setActiveMenuItem('Mis Licitaciones');
    this.router.navigate(['/Licitacion-MisLicitaciones']);
  }

  CalendarioLic() {
    this.setActiveMenuItem('Calendario');
    this.router.navigate(['/Licitacion-CalendarioLic']);
  }

  Reporte() {
    this.setActiveMenuItem('Graficos');
    this.router.navigate(['/Reporte-Licitaciones']);
  }

  private setActiveMenuItem(menuName: string) {
    // Remover clase active de todos los elementos
    if (typeof $ !== 'undefined') {
      $('.sidebar-nav a.active').removeClass('active');
      
      // Buscar y activar el elemento correspondiente
      $('.sidebar-nav a').each(function() {
        const menuText = $(this).text().trim();
        if (menuText === menuName) {
          $(this).addClass('active');
          return false; // Break the loop
        }
      });
    } else {
      // Implementación nativa
      const activeElements = document.querySelectorAll('.sidebar-nav a.active');
      activeElements.forEach(el => el.classList.remove('active'));
      
      const menuLinks = document.querySelectorAll('.sidebar-nav a');
      menuLinks.forEach(link => {
        const menuText = link.textContent?.trim() || '';
        if (menuText === menuName) {
          link.classList.add('active');
        }
      });
    }
    
    // Guardar en localStorage
    localStorage.setItem('activeMenuItem', menuName);
    console.log('Active menu item set to:', menuName);
  }

  ngOnDestroy() {
    // Limpiar event listeners al destruir el componente
    if (typeof $ !== 'undefined') {
      $(document).off('click.nav-menu');
      $(document).off('mouseenter.nav-hover mouseleave.nav-hover');
      $(document).off('mouseleave.nav-sidebar');
    } else {
      document.removeEventListener('click', this.handleDocumentClick);
      const sidebarNav = document.querySelector('.sidebar-nav');
      if (sidebarNav) {
        sidebarNav.removeEventListener('mouseleave', this.handleSidebarMouseLeave);
      }
    }

    const sidebarEl = document.getElementById('sidebar');
    if (sidebarEl && this.sidebarMouseLeaveHandler) {
      sidebarEl.removeEventListener('mouseleave', this.sidebarMouseLeaveHandler);
    }
    
    // Limpiar todas las clases animating y active que puedan quedar
    const animatingElements = document.querySelectorAll('.sidebar-nav a.animating, .sidebar-nav a.active');
    animatingElements.forEach(el => {
      el.classList.remove('animating');
      // No remover 'active' aquí para mantener el estado entre navegaciones
    });
  }

}
