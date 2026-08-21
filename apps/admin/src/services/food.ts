import { store } from '../../../src/services/store';
import { FoodRecord } from '@packages/types/src';

export const adminFoodService = {
  getAll: (): FoodRecord[] => store.getFoodRecords(),
  redeem: (agentId: string, session: 'LUNCH' | 'SNACKS' = 'LUNCH') => store.recordFoodDistribution(agentId, session)
};
