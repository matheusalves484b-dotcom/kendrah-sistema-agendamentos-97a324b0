import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { Camera, Loader2, Trash2, AlertTriangle } from "lucide-react";
import DashboardLayout from "@/components/Dashboard/DashboardLayout";
import DashboardHeader from "@/components/Dashboard/DashboardHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const MAX_FILE_SIZE = 3 * 1024 * 1024; // 3MB
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ProfileData {
  id: string;
  email: string;
  name: string;
  phone: string;
  whatsapp: string;
  slug: string | null;
  logoPath: string | null;
}

const ProfilePage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["provider-profile-page"],
    queryFn: async (): Promise<ProfileData | null> => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      const { data } = await supabase
        .from("profiles")
        .select("id, business_name, slug, whatsapp_number, business_logo_url")
        .eq("id", user.id)
        .maybeSingle();

      return {
        id: user.id,
        email: user.email ?? "",
        name: (user.user_metadata?.name as string) || data?.business_name || "",
        phone: (user.user_metadata?.phone as string) || "",
        whatsapp: data?.whatsapp_number ?? "",
        slug: data?.slug ?? null,
        logoPath: data?.business_logo_url ?? null,
      };
    },
  });

  useEffect(() => {
    if (!profile) return;
    setName(profile.name);
    setPhone(profile.phone);
    setWhatsapp(profile.whatsapp);
  }, [profile]);

  // Resolve a signed URL for the stored (private) avatar
  useEffect(() => {
    let active = true;
    const resolve = async () => {
      if (!profile?.logoPath) {
        setPhotoUrl(null);
        return;
      }
      if (profile.logoPath.startsWith("http")) {
        setPhotoUrl(profile.logoPath);
        return;
      }
      const { data } = await supabase.storage
        .from("avatars")
        .createSignedUrl(profile.logoPath, 60 * 60);
      if (active) setPhotoUrl(data?.signedUrl ?? null);
    };
    resolve();
    return () => {
      active = false;
    };
  }, [profile?.logoPath]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!profile) throw new Error("Sessão expirada. Faça login novamente.");
      if (name.trim().length < 2) throw new Error("Informe um nome com pelo menos 2 caracteres.");

      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: profile.id,
          business_name: name.trim(),
          whatsapp_number: whatsapp.trim() || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" }
      );
      if (profileError) throw profileError;

      const { error: authError } = await supabase.auth.updateUser({
        data: { name: name.trim(), phone: phone.trim() },
      });
      if (authError) throw authError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-profile-page"] });
      queryClient.invalidateQueries({ queryKey: ["provider-profile"] });
      queryClient.invalidateQueries({ queryKey: ["userData"] });
      toast({ title: "Perfil atualizado", description: "Seus dados foram salvos." });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    },
  });

  const deleteAccountMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Sessão expirada. Faça login novamente.");

      const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/delete-account`,
        {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        },
      );

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result.error || "Não foi possível excluir a conta.");
      }
      return result;
    },
    onSuccess: async () => {
      queryClient.clear();
      await supabase.auth.signOut();
      toast({ title: "Conta excluída", description: "Sua conta e todos os dados foram removidos." });
      navigate("/", { replace: true });
    },
    onError: (error: Error) => {
      toast({ title: "Erro ao excluir conta", description: error.message, variant: "destructive" });
    },
  });

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !profile) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({ title: "Formato inválido", description: "Envie uma imagem JPG, PNG ou WEBP.", variant: "destructive" });
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast({ title: "Imagem muito grande", description: "O limite é 3 MB.", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${profile.id}/avatar-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase.from("profiles").upsert(
        { id: profile.id, business_logo_url: path, updated_at: new Date().toISOString() },
        { onConflict: "id" }
      );
      if (updateError) throw updateError;

      if (profile.logoPath && !profile.logoPath.startsWith("http")) {
        await supabase.storage.from("avatars").remove([profile.logoPath]);
      }

      queryClient.invalidateQueries({ queryKey: ["provider-profile-page"] });
      queryClient.invalidateQueries({ queryKey: ["provider-profile"] });
      toast({ title: "Foto atualizada", description: "Sua nova foto de perfil já está ativa." });
    } catch (error) {
      toast({
        title: "Erro ao enviar a foto",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePhoto = async () => {
    if (!profile?.logoPath) return;
    setUploading(true);
    try {
      if (!profile.logoPath.startsWith("http")) {
        await supabase.storage.from("avatars").remove([profile.logoPath]);
      }
      const { error } = await supabase
        .from("profiles")
        .update({ business_logo_url: null, updated_at: new Date().toISOString() })
        .eq("id", profile.id);
      if (error) throw error;

      queryClient.invalidateQueries({ queryKey: ["provider-profile-page"] });
      queryClient.invalidateQueries({ queryKey: ["provider-profile"] });
      toast({ title: "Foto removida" });
    } catch (error) {
      toast({
        title: "Erro ao remover",
        description: error instanceof Error ? error.message : "Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const initials = (name || profile?.email || "P").trim().charAt(0).toUpperCase();

  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-3xl px-4 py-6 sm:py-8">
        <DashboardHeader
          title="Meu perfil"
          subtitle="Atualize seus dados e a foto que aparece para seus clientes"
        />

        {isLoading ? (
          <div className="flex h-40 items-center justify-center text-muted-foreground">
            Carregando perfil...
          </div>
        ) : (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Foto de perfil</CardTitle>
                <CardDescription>
                  Uma foto ajuda seus clientes a reconhecerem você na página de agendamento.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-5 sm:flex-row sm:items-center">
                <Avatar className="h-24 w-24 border border-border">
                  {photoUrl && <AvatarImage src={photoUrl} alt={`Foto de perfil de ${name || "prestador"}`} />}
                  <AvatarFallback className="bg-kendrah-purple/10 text-2xl font-semibold text-kendrah-purple">
                    {initials}
                  </AvatarFallback>
                </Avatar>

                <div className="flex flex-col gap-3 sm:flex-1">
                  <div className="flex flex-wrap gap-2">
                    <Button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                    >
                      {uploading ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Camera className="mr-2 h-4 w-4" />
                      )}
                      {photoUrl ? "Trocar foto" : "Adicionar foto"}
                    </Button>
                    {photoUrl && (
                      <Button
                        type="button"
                        variant="outline"
                        onClick={handleRemovePhoto}
                        disabled={uploading}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Remover
                      </Button>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">JPG, PNG ou WEBP até 3 MB.</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Dados do prestador</CardTitle>
                <CardDescription>Essas informações aparecem no seu link de agendamento.</CardDescription>
              </CardHeader>
              <CardContent>
                <form
                  className="space-y-4"
                  onSubmit={(e) => {
                    e.preventDefault();
                    saveMutation.mutate();
                  }}
                >
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome / Nome do negócio</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Ex.: Studio Bela"
                      maxLength={80}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input id="email" value={profile?.email ?? ""} disabled />
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="(11) 99999-9999"
                        maxLength={20}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="whatsapp">WhatsApp</Label>
                      <Input
                        id="whatsapp"
                        value={whatsapp}
                        onChange={(e) => setWhatsapp(e.target.value)}
                        placeholder="(11) 99999-9999"
                        maxLength={20}
                      />
                    </div>
                  </div>

                  {profile?.slug && (
                    <p className="text-sm text-muted-foreground">
                      Seu link público: <span className="font-medium text-foreground">/agendar/{profile.slug}</span>
                    </p>
                  )}

                  <Button type="submit" disabled={saveMutation.isPending}>
                    {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Salvar alterações
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProfilePage;
