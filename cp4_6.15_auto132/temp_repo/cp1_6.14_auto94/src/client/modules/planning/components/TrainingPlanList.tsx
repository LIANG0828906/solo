import { useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { Dumbbell, Calendar, CheckCircle2, Circle } from 'lucide-react';
import type { TrainingPlan, Client } from '../../../../shared/types';

interface TrainingPlanListProps {
  clientId?: string;
}

interface PlanWithClient extends TrainingPlan {
  clientName?: string;
  completionRate?: number;
}

export default function TrainingPlanList({ clientId }: TrainingPlanListProps) {
  const [plans, setPlans] = useState<PlanWithClient[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPlans = useCallback(async () => {
    setLoading(true);
    try {
      const url = clientId
        ? `/api/trainingPlans/${clientId}`
        : '/api/trainingPlans';
      const [planRes, clientRes] = await Promise.all([
        axios.get<TrainingPlan[] | TrainingPlan>(url),
        axios.get<Client[]>('/api/clients'),
      ]);
      const planData = Array.isArray(planRes.data)
        ? planRes.data
        : [planRes.data];
      setPlans(
        planData.map((p) => ({
          ...p,
          clientName: clientRes.data.find((c) => c.id === p.clientId)?.name,
        }))
      );
      setClients(clientRes.data);
    } catch {
      setPlans([]);
    } finally {
      setLoading(false);
    }
  }, [clientId]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-400">
        加载中...
      </div>
    );
  }

  if (plans.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-400">
        <Dumbbell size={40} className="mb-3 opacity-30" />
        <p>暂无训练计划</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {plans.map((plan) => {
        const totalExercises = plan.days.reduce(
          (sum, d) => sum + d.exercises.length,
          0
        );
        const completedDays = plan.days.filter(
          (d) => d.exercises.length > 0
        ).length;
        const isComplete = completedDays === plan.days.length && completedDays > 0;

        return (
          <div
            key={plan.id}
            className="card rounded-xl p-5 bg-white shadow hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="font-semibold text-gray-900">
                  {plan.clientName ?? '未知客户'}
                </h3>
                <div className="flex items-center gap-1.5 text-sm text-gray-500 mt-1">
                  <Calendar size={14} />
                  <span>{plan.weekStart}</span>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {isComplete ? (
                  <CheckCircle2 size={18} className="text-green-500" />
                ) : (
                  <Circle size={18} className="text-gray-300" />
                )}
                <span
                  className={`text-xs font-medium ${
                    isComplete ? 'text-green-600' : 'text-gray-400'
                  }`}
                >
                  {isComplete ? '已完成' : '进行中'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span>{plan.days.length}天训练</span>
              <span>{totalExercises}个动作</span>
            </div>

            <div className="mt-3 flex gap-1">
              {plan.days.map((day) => (
                <div
                  key={day.dayIndex}
                  className={`flex-1 h-1.5 rounded-full ${
                    day.exercises.length > 0 ? 'bg-orange-400' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
