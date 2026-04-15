import { Link } from 'react-router-dom'
import { Home } from 'lucide-react'

export function NotFoundPage() {
  return (
    <section className="section-card text-center">
      <span className="brand-badge">404</span>
      <h1 className="page-title mt-4">Pagina nao encontrada</h1>
      <p className="section-copy mx-auto mt-4 max-w-xl">
        O caminho que voce tentou abrir nao existe nesta versao do sistema. Vamos te levar de volta para a tela principal.
      </p>
      <Link to="/" className="primary-btn mt-6">
        <Home size={16} className="mr-2" />
        Voltar para a home
      </Link>
    </section>
  )
}
