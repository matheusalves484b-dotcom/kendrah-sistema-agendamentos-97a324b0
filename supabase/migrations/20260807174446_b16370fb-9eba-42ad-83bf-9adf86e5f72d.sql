ALTER TABLE public.appointments DROP CONSTRAINT appointments_user_id_fkey;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

ALTER TABLE public.appointments DROP CONSTRAINT appointments_service_id_fkey;
ALTER TABLE public.appointments ADD CONSTRAINT appointments_service_id_fkey FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;

ALTER TABLE public.availability_slots DROP CONSTRAINT availability_slots_user_id_fkey;
ALTER TABLE public.availability_slots ADD CONSTRAINT availability_slots_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;