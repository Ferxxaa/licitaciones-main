// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `.angular-cli.json`.

export const environment = {
  production: false,
  urlBase: "/api/",  // Usar proxy local para evitar CORS
  // node: "http://localhost:3800/api/"
  node: "http://trazas-nbi.com:3800/api/",
  arrLengt: 70,
  urlBFF: "https://bff-licitaciones-761693669403.southamerica-west1.run.app/",
  firebaseConfig: {
    apiKey: "AIzaSyAoXjfpzlCnxf5OyFXf2xQjUOkYeDphO8Q",
    authDomain: "nbi-proyectos.firebaseapp.com",
    projectId: "nbi-proyectos",
    storageBucket: "nbi-proyectos.firebasestorage.app",
    messagingSenderId: "1069264304816",
    appId: "1:1069264304816:web:008ea41769195b33231975"
  }
};
