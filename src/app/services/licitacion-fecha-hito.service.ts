import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp, getApps, getApp } from 'firebase/app';
import { getFirestore, Firestore, doc, setDoc, getDocs, collection } from 'firebase/firestore';
import { environment } from '../../environments/environment';

// Guarda la FECHA vigente de cada hito en Firestore. El backend crea un registro
// nuevo en cada edición y no permite borrar los antiguos (DELETE/PUT devuelven
// 204 sin efecto), por lo que la fecha real del hito se mantiene aquí: cada
// guardado sobrescribe el mismo documento (clave idLicitacion_idHito), así que
// nunca hay duplicados. El calendario usa estas fechas para mostrar cada hito
// únicamente en su fecha vigente.
//
// NOTA: se reutiliza la colección "hitosHora" (la misma que usa
// LicitacionHoraService) porque ya tiene permisos de lectura/escritura en las
// reglas de Firestore. Se agrega el campo "fecha" con merge para no pisar la
// hora que ya guarda ese servicio.
@Injectable({
  providedIn: 'root'
})
export class LicitacionFechaHitoService {
  private readonly coleccion = 'hitosHora';
  private app: FirebaseApp;
  private db: Firestore;

  constructor() {
    // Reutilizar la app de Firebase si ya fue inicializada por otro servicio
    this.app = getApps().length > 0 ? getApp() : initializeApp(environment.firebaseConfig);
    this.db = getFirestore(this.app);
  }

  private clave(idLicitacion: number, idHito: number): string {
    return `${idLicitacion}_${idHito}`;
  }

  // Guarda/actualiza la fecha vigente de un hito. fecha en formato yyyy-MM-dd.
  async guardarFechaHito(idLicitacion: number, idHito: number, fecha: string, hora?: string): Promise<void> {
    const payload: any = {
      idLicitacion,
      idHito,
      fecha,
      actualizadoEn: new Date().toISOString()
    };
    if (hora) payload.hora = hora;
    // merge: true para no sobrescribir el campo "hora" que guarda LicitacionHoraService
    await setDoc(doc(this.db, this.coleccion, this.clave(idLicitacion, idHito)), payload, { merge: true });
  }

  // Devuelve un mapa "idLicitacion_idHito" -> fecha vigente (yyyy-MM-dd)
  async obtenerTodasLasFechas(): Promise<Record<string, string>> {
    const snap = await getDocs(collection(this.db, this.coleccion));
    const resultado: Record<string, string> = {};
    snap.forEach(d => {
      const data = d.data();
      const lic = Number(data['idLicitacion']);
      const hito = Number(data['idHito']);
      const fecha = String(data['fecha'] || '');
      if (lic && hito && fecha) {
        resultado[`${lic}_${hito}`] = fecha;
      }
    });
    return resultado;
  }
}
