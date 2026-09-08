import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, describe, expect, it } from 'vitest';
import { useMetadataStore } from '@/stores/useMetadata';
import { useTarkovStore } from '@/stores/useTarkov';
import type { GameEdition, HideoutStation, Task } from '@/types/tarkov';
describe('useTarkovStore hideout skill prerequisites', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    const metadataStore = useMetadataStore();
    metadataStore.tasks = [
      {
        id: 'task-strength-alias',
        objectives: [],
        finishRewards: {
          skillLevelReward: [
            {
              name: 'Starke',
              level: 0,
              skill: { id: 'Strength', name: 'Starke' },
            },
          ],
        },
      },
    ] as Task[];
    metadataStore.hideoutStations = [
      {
        id: 'station-gym',
        name: 'Gym',
        normalizedName: 'gym',
        levels: [
          {
            id: 'module-gym-1',
            level: 1,
            constructionTime: 0,
            itemRequirements: [],
            stationLevelRequirements: [],
            skillRequirements: [{ id: 'req-strength-10', name: 'Strength', level: 10 }],
            traderRequirements: [],
            crafts: [],
          },
        ],
      },
    ] as HideoutStation[];
    metadataStore.editions = [
      {
        id: 'edition-standard',
        value: 1,
        title: 'Standard',
        defaultStashLevel: 0,
        defaultCultistCircleLevel: 0,
        traderRepBonus: {},
      },
    ] as GameEdition[];
  });
  it('deduplicates localized and canonical offsets during hideout skill checks', () => {
    const tarkovStore = useTarkovStore();
    tarkovStore.setHideoutModuleComplete('module-gym-1');
    tarkovStore.setSkillOffset('Strength', 6);
    tarkovStore.setSkillOffset('Starke', 12);
    const removedCount = tarkovStore.enforceHideoutPrereqsNow();
    expect(removedCount).toBe(1);
    expect(tarkovStore.isHideoutModuleComplete('module-gym-1')).toBe(false);
  });
});
