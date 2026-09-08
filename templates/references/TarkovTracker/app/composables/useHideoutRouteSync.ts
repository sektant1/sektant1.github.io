import { useRouteFilters } from '@/composables/useRouteFilters';
import { usePreferencesStore } from '@/stores/usePreferences';
import type { HideoutPrimaryView } from '@/composables/useHideoutFiltering';
const HIDEOUT_PRIMARY_VIEWS = ['available', 'maxed', 'locked', 'all'] as const;
const isValidHideoutView = (value: string): value is HideoutPrimaryView =>
  HIDEOUT_PRIMARY_VIEWS.includes(value as HideoutPrimaryView);
type HideoutRouteParams = {
  view: string;
};
export function useHideoutRouteSync() {
  const preferencesStore = usePreferencesStore();
  const hideoutPrimaryView = computed(
    () => (preferencesStore.getHideoutPrimaryView as HideoutPrimaryView | undefined) ?? 'available'
  );
  return useRouteFilters<HideoutRouteParams>({
    configs: {
      view: {
        key: 'view',
        default: 'available',
        validate: isValidHideoutView,
        serialize: (v) => (v === 'available' ? undefined : v),
        deserialize: (v) => v,
      },
    },
    onRouteToStore: (values) => {
      if (values.view !== hideoutPrimaryView.value) {
        preferencesStore.setHideoutPrimaryView(values.view);
      }
    },
    onStoreToRoute: () => ({
      view: hideoutPrimaryView.value,
    }),
    watchSources: [hideoutPrimaryView],
  });
}
