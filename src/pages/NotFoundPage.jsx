import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export function NotFoundPage() {
  return (
    <section className="section-card text-center">
      <span className="brand-badge">404</span>
      <h1 className="page-title mt-4">Página não encontrada</h1>
      <p className="section-copy mx-auto mt-4 max-w-xl">
        O caminho que você tentou abrir não existe nesta versão do sistema. Vamos levar você de volta para a tela principal.
      </p>
      <Link to="/" className="primary-btn mt-6">
        <Home size={16} className="mr-2" />
        Voltar para o início
      </Link>
    </section>
  )
}
