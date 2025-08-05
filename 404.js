export default function Custom404() {
  return (
    <div style={{ 
      display: 'flex', flexDirection: 'column', alignItems: 'center', 
      justifyContent: 'center', height: '100vh', background: 'black', color: '#fff' 
    }}>
      <h1 style={{ fontSize: '4rem', color: 'violet' }}>404</h1>
      <p>Lo sentimos, esta página no existe.</p>
      <a href="/" style={{ color: '#ccc' }}>Volver al inicio</a>
    </div>
  )
}
