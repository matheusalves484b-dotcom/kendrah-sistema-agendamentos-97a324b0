import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Check, Loader2, RefreshCw } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/Dashboard/DashboardLayout';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface SubscriptionStatus {
  status: 'none' | 'trialing' | 'active' | 'past_due' | 'canceled';
  subscribed: boolean;
  current_period_end: string | null;
  trial_end: string | null;
}

const features = [
  'Agendamentos ilimitados',
  'Cadastro e histórico de clientes',
  'Relatório mensal automático (CSV e PDF)',
  'Página pública de agendamento',
  'Lembretes por WhatsApp',
];

const formatDate = (value: string | null) =>
  value ? new Date(value).toLocaleDateString('pt-BR') : null;

const SubscriptionPage = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  const { data, isLoading, isFetching, refetch } = useQuery<SubscriptionStatus>({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('check-subscription');
      if (error) throw error;
      return data as SubscriptionStatus;
    },
  });

  useEffect(() => {
    const checkout = searchParams.get('checkout');
    if (!checkout) return;
    if (checkout === 'success') {
      toast.success('Assinatura confirmada! Atualizando seus dados...');
      queryClient.invalidateQueries({ queryKey: ['subscription'] });
    } else {
      toast.info('Checkout cancelado. Nada foi cobrado.');
    }
    searchParams.delete('checkout');
    setSearchParams(searchParams, { replace: true });
  }, [searchParams, setSearchParams, queryClient]);

  const checkout = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('create-checkout');
      if (error) throw error;
      if (!data?.url) throw new Error('Não foi possível iniciar o checkout');
      return data.url as string;
    },
    onSuccess: (url) => {
      window.open(url, '_blank');
    },
    onError: (error: Error) => toast.error(error.message || 'Erro ao iniciar o pagamento'),
  });

  const portal = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('customer-portal');
      if (error) throw error;
      if (!data?.url) throw new Error('Não foi possível abrir o portal');
      return data.url as string;
    },
    onSuccess: (url) => {
      window.open(url, '_blank');
    },
    onError: (error: Error) => toast.error(error.message || 'Erro ao abrir o portal'),
  });

  const status = data?.status ?? 'none';

  const statusBadge = () => {
    switch (status) {
      case 'active':
        return <Badge>Ativa</Badge>;
      case 'trialing':
        return <Badge variant="secondary">Em teste</Badge>;
      case 'past_due':
        return <Badge variant="destructive">Pagamento pendente</Badge>;
      case 'canceled':
        return <Badge variant="destructive">Cancelada</Badge>;
      default:
        return <Badge variant="outline">Sem assinatura</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="p-4 sm:p-6 max-w-2xl">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Assinatura</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            aria-label="Atualizar status da assinatura"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <CardTitle className="text-xl">Plano Kendrah Mensal</CardTitle>
                  <CardDescription className="text-lg font-medium mt-1">
                    R$ 39,90/mês · 7 dias grátis
                  </CardDescription>
                </div>
                {statusBadge()}
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {status === 'trialing' && (
                <div className="rounded-md bg-muted p-4">
                  <p className="font-medium">
                    Teste gratuito até {formatDate(data?.trial_end) ?? '—'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    A primeira cobrança acontece automaticamente no fim do período.
                  </p>
                </div>
              )}

              {status === 'active' && (
                <div className="rounded-md bg-muted p-4">
                  <p className="font-medium">
                    Assinatura ativa até {formatDate(data?.current_period_end) ?? '—'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    A renovação é automática.
                  </p>
                </div>
              )}

              {status === 'past_due' && (
                <div className="rounded-md bg-destructive/10 p-4">
                  <p className="font-medium text-destructive">
                    Não conseguimos processar seu último pagamento.
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Atualize a forma de pagamento no portal para manter o acesso.
                  </p>
                </div>
              )}

              {(status === 'none' || status === 'canceled') && (
                <div className="rounded-md bg-muted p-4">
                  <p className="font-medium">
                    {status === 'canceled'
                      ? 'Sua assinatura foi cancelada.'
                      : 'Comece com 7 dias grátis.'}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Você pode cancelar quando quiser, sem multa.
                  </p>
                </div>
              )}

              <div>
                <h2 className="font-medium mb-2">O que está incluso</h2>
                <ul className="space-y-2">
                  {features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col sm:flex-row gap-3">
              {data?.subscribed || status === 'past_due' ? (
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => portal.mutate()}
                  disabled={portal.isPending}
                >
                  {portal.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Gerenciar assinatura
                </Button>
              ) : (
                <Button
                  className="w-full"
                  onClick={() => checkout.mutate()}
                  disabled={checkout.isPending}
                >
                  {checkout.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {status === 'canceled' ? 'Reativar assinatura' : 'Assinar com 7 dias grátis'}
                </Button>
              )}
            </CardFooter>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
};

export default SubscriptionPage;
