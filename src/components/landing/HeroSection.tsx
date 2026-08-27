import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { CalendarCheck, MessageCircle, Sparkles, ArrowRight } from 'lucide-react';

const HeroSection = () => {
  return (
    <section className="relative overflow-hidden bg-hero-gradient text-white">
      <div className="absolute inset-0 grid-pattern opacity-60" aria-hidden="true" />
      <div className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-kendrah-purple/40 blur-3xl" aria-hidden="true" />
      <div className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-accent/30 blur-3xl" aria-hidden="true" />

      <div className="container relative mx-auto px-6 py-20 md:py-28">
        <div className="grid items-center gap-14 lg:grid-cols-2">
          <div className="animate-fade-in">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium backdrop-blur">
              <Sparkles className="h-4 w-4" />
              7 dias grátis · cancele quando quiser
            </span>

            <h1 className="mt-6 text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl xl:text-6xl">
              Automatize sua agenda.
              <span className="block text-gradient">Simplifique sua rotina.</span>
            </h1>

            <p className="mt-6 max-w-xl text-lg text-white/80 md:text-xl">
              A Kendrah organiza seus horários, confirma clientes pelo WhatsApp e transforma
              seu link de agendamento em uma máquina silenciosa de novos atendimentos.
            </p>

            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link to="/register">
                <Button size="lg" className="group h-14 w-full bg-white px-8 text-base font-semibold text-kendrah-purple hover:bg-white/90 sm:w-auto">
                  Começar teste grátis
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <Link to="/login">
                <Button
                  size="lg"
                  variant="outline"
                  className="h-14 w-full border-white/40 bg-white/5 px-8 text-base font-semibold text-white backdrop-blur hover:bg-white/15 hover:text-white sm:w-auto"
                >
                  Área do cliente
                </Button>
              </Link>
            </div>

            <dl className="mt-12 grid max-w-lg grid-cols-3 gap-6 border-t border-white/15 pt-8">
              {[
                { value: '+60 horas', label: 'economizadas por mês' },
                { value: '‑42%', label: 'de faltas com lembretes' },
                { value: '24/7', label: 'agenda aberta online' },
              ].map((stat) => (
                <div key={stat.label}>
                  <dt className="text-2xl font-bold md:text-3xl">{stat.value}</dt>
                  <dd className="mt-1 text-xs text-white/65 md:text-sm">{stat.label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="relative">
            <div className="absolute inset-0 rounded-3xl bg-white/10 blur-2xl" aria-hidden="true" />
            <img
              alt="Kendrah — sistema de agendamentos online"
              className="relative w-full rounded-2xl border border-white/15 shadow-elegant"
              src="/lovable-uploads/3cb7ac49-9e22-4c45-83db-279995a935ba.png"
              width={1024}
              height={640}
            />

            <div className="glass-card animate-float-slow absolute -left-4 bottom-8 hidden rounded-xl px-4 py-3 shadow-glow sm:flex sm:items-center sm:gap-3">
              <CalendarCheck className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">Novo agendamento</p>
                <p className="text-xs text-white/70">Hoje, 14:30 · confirmado</p>
              </div>
            </div>

            <div className="glass-card animate-float-slow absolute -right-3 top-8 hidden rounded-xl px-4 py-3 shadow-glow sm:flex sm:items-center sm:gap-3">
              <MessageCircle className="h-5 w-5" />
              <div>
                <p className="text-sm font-semibold">Lembrete enviado</p>
                <p className="text-xs text-white/70">WhatsApp · 1 dia antes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
