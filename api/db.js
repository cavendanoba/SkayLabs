import { neon } from '@neondatabase/serverless';

// Creamos la función sql una sola vez
// process.env.DATABASE_URL viene de las variables de Vercel
export const sql = neon(process.env.DATABASE_URL);

//Si en algún momento quiero cambiar la BD solo debo modificar esta función y el resto del código seguirá funcionando

/* Las API funcionan para traer datos, no para escribirlos, por eso no exportamos funciones de escritura, solo de lectura
* Puedo crearlas y de esta forma mantengo toda la lógica de acceso a datos en un solo lugar, 
* lo que hace que el código sea más fácil de mantener y escalar. 
* Además, al centralizar el acceso a la base de datos, puedo implementar fácilmente características como 
* el manejo de errores, la optimización de consultas y la gestión de conexiones sin tener que modificar cada parte del código que 
* interactúa con la base de datos.
* Esto también facilita la implementación de pruebas unitarias, ya que puedo simular la función sql para probar la lógica de negocio 
* sin necesidad de una base de datos real.
*/