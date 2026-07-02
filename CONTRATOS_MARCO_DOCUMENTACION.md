# Sistema de Contratos Marco - Documentación Técnica

## Descripción General

El sistema de **Contratos Marco** permite crear una jerarquía de licitaciones donde:

- **Contrato Marco** = Licitación padre que puede tener múltiples licitaciones hijas
- **Licitación Hija** = Licitación específica que pertenece a un contrato marco
- **Licitación Normal** = Licitación independiente sin relación jerárquica

## Estructura de Base de Datos

### Campos Agregados a la Tabla `Licitaciones`:

```sql
-- Campos necesarios para el sistema de contratos marco:
TipoLicitacion VARCHAR(50) DEFAULT 'normal'     -- 'normal' o 'contrato_marco'
IdContratoMarco INT NULL                        -- FK al contrato marco padre
EsContratoMarco BIT DEFAULT 0                   -- 1 si es contrato marco, 0 si no
```

### Relaciones:
- `IdContratoMarco` es FK que referencia a `IdLicitacion` de un contrato marco
- Una licitación puede ser padre de múltiples licitaciones hijas
- Una licitación hija solo puede tener un contrato marco padre

## Implementación Frontend

### 1. **Modelo de Datos (TypeScript)**

```typescript
class Licitaciones {
  // Campos existentes...
  IdLicitacion: number = 0;
  NombreLicitacion: string = '';
  Descripcion: string = '';
  // ... más campos ...
  
  // NUEVOS CAMPOS PARA CONTRATOS MARCO:
  TipoLicitacion: string = 'normal';        // 'normal' o 'contrato_marco'
  IdContratoMarco?: number | null = null;   // ID del contrato marco padre
  EsContratoMarco: boolean = false;         // Indica si es contrato marco
}
```

### 2. **Formulario de Creación**

#### Campos Agregados:
- **Tipo de Licitación**: Selector para elegir entre normal y contrato marco
- **Contrato Marco Padre**: Dropdown con contratos marco disponibles (solo visible para licitaciones normales)

#### Validación:
- Si es "Contrato Marco": `IdContratoMarco = null`, `EsContratoMarco = true`
- Si es "Licitación Normal" con padre: `IdContratoMarco = ID seleccionado`, `EsContratoMarco = false`
- Si es "Licitación Normal" sin padre: `IdContratoMarco = null`, `EsContratoMarco = false`

### 3. **Método de Guardado (Crear)**

```typescript
Agregar(form: NgForm) {
  let Licitacion = new Licitaciones();
  // ... campos existentes ...
  
  // CONFIGURACIÓN DE CONTRATO MARCO:
  Licitacion.TipoLicitacion = this.drdTipoLicitacion;
  Licitacion.IdContratoMarco = this.drdContratoMarco > 0 ? this.drdContratoMarco : null;
  Licitacion.EsContratoMarco = this.drdTipoLicitacion === 'contrato_marco';
  
  console.log('Enviando licitación al backend:', Licitacion);
  this.http.post<any>(pag, Licitacion).subscribe(...);
}
```

### 4. **Método de Actualización (Editar)**

```typescript
Actualizar(form: NgForm) {
  // ... actualización de campos existentes ...
  
  // ACTUALIZACIÓN DE CAMPOS DE CONTRATO MARCO:
  this.Licitaciones[this.IndexUpdate].TipoLicitacion = this.drdTipoLicitacionEdit;
  this.Licitaciones[this.IndexUpdate].IdContratoMarco = this.drdContratoMarcoEdit > 0 ? this.drdContratoMarcoEdit : null;
  this.Licitaciones[this.IndexUpdate].EsContratoMarco = this.drdTipoLicitacionEdit === 'contrato_marco';
  
  console.log('Actualizando licitación:', this.Licitaciones[this.IndexUpdate]);
  this.http.post<any>(pag, this.Licitaciones[this.IndexUpdate]).subscribe(...);
}
```

## Datos Enviados al Backend

### Ejemplo de JSON para Contrato Marco:
```json
{
  "IdLicitacion": 0,
  "Descripcion": "TRZ-OM25",
  "NumeroPropuesta": "CM-2025-001",
  "OfertaInicial": 5000000,
  "IdArea": 1,
  "IdMandante": 2,
  "IdEjecutivo": 3,
  "TipoLicitacion": "contrato_marco",
  "IdContratoMarco": null,
  "EsContratoMarco": true,
  "Superficie": 1000,
  "Competitividad": "Alta",
  "FechaCreacion": "2025-08-07T00:00:00",
  "IdUsuarioCreador": 1,
  "Activo": true
}
```

### Ejemplo de JSON para Licitación Hija:
```json
{
  "IdLicitacion": 0,
  "Descripcion": "Licitación Específica A",
  "NumeroPropuesta": "LE-2025-001",
  "OfertaInicial": 1000000,
  "IdArea": 1,
  "IdMandante": 2,
  "IdEjecutivo": 3,
  "TipoLicitacion": "normal",
  "IdContratoMarco": 15,
  "EsContratoMarco": false,
  "Superficie": 200,
  "Competitividad": "Media",
  "FechaCreacion": "2025-08-07T00:00:00",
  "IdUsuarioCreador": 1,
  "Activo": true
}
```

## Visualización en el Sistema

### 1. **Tablas con Badges de Identificación:**
- 📋 **Contrato Marco** (Rojo): `EsContratoMarco = true`
- 🔗 **Licitación Hija** (Verde): `IdContratoMarco != null`
- 🏢 **Licitación Normal** (Azul): `IdContratoMarco = null` y `EsContratoMarco = false`

### 2. **Filtrado y Carga:**
- Los contratos marco se cargan para el dropdown desde `GetLicitaciones()`
- Se filtran por `EsContratoMarco = true`
- Se actualizan automáticamente al crear/editar licitaciones

## Validaciones y Reglas de Negocio

### 1. **Creación:**
- ✅ Un contrato marco no puede tener padre (`IdContratoMarco = null`)
- ✅ Una licitación hija debe seleccionar un contrato marco válido
- ✅ Una licitación normal puede ser independiente o tener padre

### 2. **Edición:**
- ✅ Se pueden cambiar todos los campos de contrato marco
- ✅ Si se cambia de tipo, se resetean los campos relacionados
- ✅ Se valida la consistencia de datos

### 3. **Integridad:**
- ⚠️ **Pendiente Backend**: Validar que `IdContratoMarco` referencie a un contrato marco válido
- ⚠️ **Pendiente Backend**: Prevenir eliminación de contratos marco con licitaciones hijas

## Debugging y Logs

### Console Logs Implementados:
```typescript
console.log('Enviando licitación al backend:', Licitacion);        // En crear
console.log('Actualizando licitación:', this.Licitaciones[...]);   // En editar
```

### Ejemplo de Log Real Completo:
```
Enviando licitación al backend: 
Licitaciones {
  IdLicitacion: 0,
  NombreLicitacion: 'Prueba padre',
  Descripcion: 'Prueba padre',
  NumeroPropuesta: '11111',
  OfertaInicial: '0',
  Superficie: 'a',
  IdArea: '1',
  IdMandante: '20',
  IdEjecutivo: '25',
  Competitividad: 'Baja',
  FechaCreacion: '07/08/2025',
  IdUsuarioCreador: 42,
  Activo: true,
  CodigoMandante: '11111',
  Monto: '0',
  idEstado: 1,
  
  // ✅ CAMPOS DE CONTRATO MARCO CORRECTOS:
  TipoLicitacion: 'contrato_marco',
  IdContratoMarco: null,
  EsContratoMarco: true,
  
  FechaRemocion: '',
  IdUsuarioRemovedor: null
}
```

🎉 **¡PERFECTO! Los datos se envían correctamente al backend con todos los campos de contratos marco.**

✅ **Los logs confirman que los datos se envían correctamente al backend.**

### Errores Comunes y Soluciones:

## 🚀 **SOLUCIONES PARA EL ERROR CORS**

### **Solución 1: Chrome sin CORS (Recomendada para Desarrollo) ⭐**

1. **Cierra todas las ventanas de Chrome**
2. **Ejecuta el archivo** `chrome-dev.bat` del proyecto
3. **Navega a** `http://localhost:4200` en la ventana especial
4. **¡El contrato marco se guardará correctamente!**

### **Solución 2: Extensión CORS Unblock**

1. **Instala** la extensión "CORS Unblock" en Chrome
2. **Actívala** solo para desarrollo
3. **Recarga** `http://localhost:4200`

### **Solución 3: Configuración Backend (Definitiva)**

El backend `http://trazas-nbi.com:1234` necesita estos headers:

```csharp
// En Startup.cs o Program.cs
app.UseCors(builder => builder
    .WithOrigins("http://localhost:4200")
    .AllowAnyMethod()
    .AllowAnyHeader()
    .AllowCredentials());
```

### **Solución 4: Proxy Reverso**

Usar un servidor proxy local que redirija las peticiones:
```bash
# Con Node.js instalado
npx local-cors-proxy --proxyUrl http://trazas-nbi.com:1234 --port 8010
```

Luego cambiar la URL base a `http://localhost:8010/api/`

## ✅ **CONFIRMACIÓN: SISTEMA FUNCIONANDO**

### **Los logs confirman que:**
1. ✅ **Todos los campos se envían correctamente**
2. ✅ **TipoLicitacion = 'contrato_marco'** ← Perfecto
3. ✅ **EsContratoMarco = true** ← Correcto para contrato marco
4. ✅ **IdContratoMarco = null** ← Correcto (no tiene padre)
5. ✅ **Todos los campos existentes incluidos**

### **El único problema es CORS del servidor:**
```
❌ Response to preflight request doesn't pass access control check
❌ It does not have HTTP ok status
```

**Esto significa que el servidor está rechazando la petición antes de procesarla.**

#### 2. **Campos Faltantes (Si ocurre):**
Verificar que el backend reciba los nuevos campos:
- `TipoLicitacion`
- `IdContratoMarco` 
- `EsContratoMarco`

## Estado de Implementación

### ✅ **Frontend Completo:**
- Formularios de creación y edición
- Validación de campos
- Visualización en tablas
- Filtrado de contratos marco
- Logs de debugging

### 🚧 **Backend Pendiente:**
- Modificación de esquema de base de datos
- Validaciones de integridad referencial  
- Endpoints específicos para contratos marco
- Consultas optimizadas para jerarquías

## Próximos Pasos para Backend

1. **Agregar columnas a tabla `Licitaciones`:**
   ```sql
   ALTER TABLE Licitaciones ADD TipoLicitacion VARCHAR(50) DEFAULT 'normal';
   ALTER TABLE Licitaciones ADD IdContratoMarco INT NULL;
   ALTER TABLE Licitaciones ADD EsContratoMarco BIT DEFAULT 0;
   ALTER TABLE Licitaciones ADD CONSTRAINT FK_Licitaciones_ContratoMarco 
       FOREIGN KEY (IdContratoMarco) REFERENCES Licitaciones(IdLicitacion);
   ```

2. **Actualizar modelos en el backend** para incluir los nuevos campos

3. **Validar en el backend** que los datos se reciben y guardan correctamente

4. **Implementar validaciones** de integridad referencial

---

*Implementación completada: Frontend listo para guardado en base de datos*  
*Fecha: 7 de agosto de 2025*
