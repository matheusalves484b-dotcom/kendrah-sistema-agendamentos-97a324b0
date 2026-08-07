import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Smartphone, Share2, PlusSquare, ArrowRight, Home, CheckCircle2 } from 'lucide-react';

const InstallInstructionsPage = () => {
  return (
    <div className="min-h-screen flex flex-col justify-center items-center bg-kendrah-gray/30 p-4">
      <div className="mb-8 text-center">
        <Link to="/" className="text-3xl font-bold text-kendrah-purple">Kendrah</Link>
        <p className="text-gray-500 mt-2">Automatize sua agenda. Simplifique sua rotina.</p>
      </div>

      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-kendrah-purple/10 rounded-full flex items-center justify-center mb-4">
            <Smartphone className="w-8 h-8 text-kendrah-purple" />
          </div>
          <CardTitle className="text-2xl font-bold">Adicione o Kendrah à sua tela inicial</CardTitle>
          <CardDescription>
            Acesse seus agendamentos como um aplicativo, com um toque só.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* iOS instructions */}
            <div className="bg-kendrah-light rounded-xl p-5 border border-kendrah-gray/40">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-gray-800 text-white text-xs font-semibold px-2 py-1 rounded">iPhone / iPad</span>
              </div>
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-kendrah-purple/10 text-kendrah-purple flex items-center justify-center text-sm font-semibold">1</div>
                  <div className="text-sm text-gray-700">
                    Abra o <strong className="text-kendrah-black">Safari</strong> e acesse o Kendrah.
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-kendrah-purple/10 text-kendrah-purple flex items-center justify-center text-sm font-semibold">2</div>
                  <div className="text-sm text-gray-700">
                    Toque no ícone <Share2 className="inline w-4 h-4 mx-1 text-kendrah-purple" /> <strong>Compartilhar</strong>, na barra inferior.
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-kendrah-purple/10 text-kendrah-purple flex items-center justify-center text-sm font-semibold">3</div>
                  <div className="text-sm text-gray-700">
                    Role a lista e selecione <strong className="text-kendrah-black">"Adicionar à Tela de Início"</strong> <PlusSquare className="inline w-4 h-4 mx-1 text-kendrah-purple" />.
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-kendrah-purple/10 text-kendrah-purple flex items-center justify-center text-sm font-semibold">4</div>
                  <div className="text-sm text-gray-700">
                    Toque em <strong className="text-kendrah-black">Adicionar</strong> no canto superior direito.
                  </div>
                </li>
              </ol>
            </div>

            {/* Android instructions */}
            <div className="bg-kendrah-light rounded-xl p-5 border border-kendrah-gray/40">
              <div className="flex items-center gap-2 mb-4">
                <span className="bg-kendrah-purple text-white text-xs font-semibold px-2 py-1 rounded">Android</span>
              </div>
              <ol className="space-y-4">
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-kendrah-purple/10 text-kendrah-purple flex items-center justify-center text-sm font-semibold">1</div>
                  <div className="text-sm text-gray-700">
                    Abra o <strong className="text-kendrah-black">Chrome</strong> e acesse o Kendrah.
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-kendrah-purple/10 text-kendrah-purple flex items-center justify-center text-sm font-semibold">2</div>
                  <div className="text-sm text-gray-700">
                    Toque nos <strong className="text-kendrah-black">3 pontos</strong> no canto superior direito.
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-kendrah-purple/10 text-kendrah-purple flex items-center justify-center text-sm font-semibold">3</div>
                  <div className="text-sm text-gray-700">
                    Selecione <strong className="text-kendrah-black">"Adicionar à tela inicial"</strong> <Home className="inline w-4 h-4 mx-1 text-kendrah-purple" />.
                  </div>
                </li>
                <li className="flex gap-3">
                  <div className="flex-shrink-0 w-6 h-6 rounded-full bg-kendrah-purple/10 text-kendrah-purple flex items-center justify-center text-sm font-semibold">4</div>
                  <div className="text-sm text-gray-700">
                    Toque em <strong className="text-kendrah-black">Adicionar</strong> e depois em <strong className="text-kendrah-black">Instalar</strong>.
                  </div>
                </li>
              </ol>
            </div>
          </div>

          <div className="bg-kendrah-purple/5 rounded-lg p-4 flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-kendrah-purple flex-shrink-0 mt-0.5" />
            <p className="text-sm text-gray-700">
              <strong>Dica:</strong> depois de adicionar, o ícone do Kendrah aparece ao lado dos seus outros apps. Você pode usar normalmente, receber notificações e acessar seu painel com um toque.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button className="kendrah-button w-full sm:w-auto">
                Ir para o painel
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/dashboard" className="w-full sm:w-auto">
              <Button variant="outline" className="w-full sm:w-auto border-kendrah-gray text-gray-600 hover:bg-kendrah-gray/20">
                Adicionar depois
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InstallInstructionsPage;
