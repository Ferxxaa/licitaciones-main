import { Injectable } from '@angular/core';
import { initializeApp, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore, doc, setDoc, getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { environment } from '../../environments/environment';

// Guarda la hora de creación de cada licitación en Firestore, ya que el
// backend actual no persiste la hora (solo la fecha) y no es modificable.
@Injectable({
  providedIn: 'root'
})
export class LicitacionHoraService {
  private readonly coleccion = 'licitacionesHora';
  private app: FirebaseApp;
  private db: Firestore;

  constructor() {
    this.app = initializeApp(environment.firebaseConfig);
    this.db = getFirestore(this.app);
  }

  private getHoraChile(): string {
    const date = new Date();
    let offset = -4; // Invierno
    const mes = date.getMonth() + 1;
    if (mes >= 9 || mes <= 4) offset = -3; // Verano
    const utc = date.getUTCHours();
    let horaChile = utc + offset;
    if (horaChile < 0) horaChile += 24;
    if (horaChile >= 24) horaChile -= 24;
    const minutos = date.getMinutes();
    return `${horaChile.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}`;
  }

  async guardarHoraCreacion(idLicitacion: number, hora?: string): Promise<void> {
    const horaCreacion = hora || this.getHoraChile();
    await setDoc(doc(this.db, this.coleccion, String(idLicitacion)), {
      idLicitacion,
      horaCreacion,
      creadoEn: new Date().toISOString()
    });
  }

  async obtenerHoraCreacion(idLicitacion: number): Promise<string | null> {
    const snap = await getDoc(doc(this.db, this.coleccion, String(idLicitacion)));
    return snap.exists() ? (snap.data()['horaCreacion'] as string) : null;
  }

  // Devuelve un mapa idLicitacion -> horaCreacion para mostrar en listados
  async obtenerTodasLasHoras(): Promise<Record<number, string>> {
    const snap = await getDocs(collection(this.db, this.coleccion));
    const resultado: Record<number, string> = {};
    snap.forEach(d => {
      const data = d.data();
      resultado[Number(d.id)] = data['horaCreacion'];
    });
    return resultado;
  }

  // Hora de compromiso de los hitos: el backend no persiste este campo de forma confiable,
  // así que se guarda aparte en Firestore, clave = idLicitacion_idHito.
  private readonly coleccionHitos = 'hitosHora';

  private claveHito(idLicitacion: number, idHito: number): string {
    return `${idLicitacion}_${idHito}`;
  }

  async guardarHoraHito(idLicitacion: number, idHito: number, hora: string): Promise<void> {
    await setDoc(doc(this.db, this.coleccionHitos, this.claveHito(idLicitacion, idHito)), {
      idLicitacion,
      idHito,
      hora,
      actualizadoEn: new Date().toISOString()
    });
  }

  // Devuelve un mapa idHito -> hora para los hitos de una licitación
  async obtenerHorasHitos(idLicitacion: number): Promise<Record<number, string>> {
    const q = query(collection(this.db, this.coleccionHitos), where('idLicitacion', '==', idLicitacion));
    const snap = await getDocs(q);
    const resultado: Record<number, string> = {};
    snap.forEach(d => {
      const data = d.data();
      resultado[Number(data['idHito'])] = data['hora'];
    });
    return resultado;
  }
}
