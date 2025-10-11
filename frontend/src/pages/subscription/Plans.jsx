/**
 * Subscription Plans Page
 * View and compare available plans
 */

import { useState } from 'react';
import { PlanComparison } from '../../../components/features/subscription/PlanComparison';
import { PlanUpgrade } from '../../../components/features/subscription/PlanUpgrade';
import { useQuery } from '@tanstack/react-query';
import { subscriptionService } from '../../../services/subscription';

export const Plans = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const { data: plans } = useQuery({
    queryKey: ['plans'],
    queryFn: subscriptionService.getPlans,
  });

  const { data: currentPlan } = useQuery({
    queryKey: ['current-plan'],
    queryFn: subscriptionService.getCurrentPlan,
  });

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
    setShowUpgradeModal(true);
  };

  return (
    <div className="space-y-6">
      <PlanComparison
        plans={plans}
        currentPlan={currentPlan}
        onSelectPlan={handleSelectPlan}
      />

      {showUpgradeModal && selectedPlan && (
        <PlanUpgrade
          currentPlan={currentPlan}
          targetPlan={selectedPlan}
          onClose={() => {
            setShowUpgradeModal(false);
            setSelectedPlan(null);
          }}
        />
      )}
    </div>
  );
};

export default Plans;
