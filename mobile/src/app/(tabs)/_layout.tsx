import AppTabs from '@/components/app-tabs';

/**
 * Grupo de rutas con sesión iniciada.
 *
 * Las pestañas se declaran en components/app-tabs.tsx (y su gemelo .web.tsx),
 * que es andamiaje compartido del equipo.
 */
export default function TabsLayout() {
  return <AppTabs />;
}
