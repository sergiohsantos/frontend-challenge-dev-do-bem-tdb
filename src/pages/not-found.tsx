import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'

export default function NotFoundPage() {
  return <div className="flex min-h-screen flex-col bg-background">
    <Header />
    <main id="main-content" tabIndex={-1} className="container mx-auto flex-1 px-4 py-24 text-center">
      <p className="text-muted-foreground">Erro 404</p>
      <h1 className="mt-3 text-3xl font-bold">Página não encontrada</h1>
      <p className="my-6 text-muted-foreground">Confira o endereço ou volte à página inicial para continuar.</p>
      <Button asChild><Link to="/">Ir para a página inicial</Link></Button>
    </main>
    <Footer />
  </div>
}
