import { useEffect, useState } from 'react';
import { useFoodStore } from '../store/useFoodStore';
import type { Meal } from '../types';
import styles from './MealPlanPage.module.css';

type GoalType = 'muscle' | 'fatLoss' | 'balanced';

const goalLabels: Record<GoalType, string> = {
  muscle: '增肌',
  fatLoss: '减脂',
  balanced: '均衡',
};

const mealLabels: Record<string, { label: string; icon: string }> = {
  breakfast: { label: '早餐', icon: '🌅' },
  lunch: { label: '午餐', icon: '☀️' },
  dinner: { label: '晚餐', icon: '🌙' },
};

const MealCard = ({
  meal,
  index,
  sectionIndex,
}: {
  meal: Meal;
  index: number;
  sectionIndex: number;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const totalDelay = (sectionIndex * 2 + index) * 100;

  return (
    <div
      className={`${styles.mealCard} ${isExpanded ? styles.cardExpanded : ''}`}
      style={{
        opacity: 0,
        animation: `fadeIn 0.4s ease-out ${totalDelay}ms forwards`,
      }}
    >
      <div className={styles.cardHeader} onClick={() => setIsExpanded(!isExpanded)}>
        <span className={styles.cookTimeBadge}>⏱ {meal.cookTime}分钟</span>
        <div className={styles.cardHeaderContent}>
          <h3 className={styles.mealName}>{meal.name}</h3>
          <div className={styles.nutritionInfo}>
            <span className={styles.nutritionItem}>🔥 {meal.calories} 千卡</span>
            <span className={styles.nutritionItem}>💪 蛋白{meal.protein}g</span>
            <span className={styles.nutritionItem}>🥑 脂肪{meal.fat}g</span>
            <span className={styles.nutritionItem}>🍚 碳水{meal.carb}g</span>
          </div>
        </div>
        <div className={styles.ingredientsList}>
          {meal.ingredients.map((ing, i) => (
            <span
              key={i}
              className={`${styles.ingredientTag} ${
                !ing.inStock ? styles.ingredientMissing : ''
              }`}
              style={!ing.inStock ? { animation: `blink 1.2s ease-in-out infinite` } : undefined}
            >
              {ing.name} {ing.amount}
              {ing.unit}
              {!ing.inStock && (
                <span className={styles.missingHint}> (库存不足)</span>
              )}
            </span>
          ))}
        </div>
        <span className={`${styles.expandIcon} ${isExpanded ? styles.expanded : ''}`}>▼</span>
      </div>

      <div
        className={`${styles.detailPanel} ${isExpanded ? styles.panelOpen : ''}`}
      >
        <div className={styles.panelInner}>
          <div className={styles.panelSection}>
            <h4 className={styles.panelSectionTitle}>🥗 食材用量</h4>
            <div className={styles.ingredientsGrid}>
              {meal.ingredients.map((ing, i) => (
                <div
                  key={i}
                  className={`${styles.ingredientItem} ${
                    !ing.inStock ? styles.ingredientItemMissing : ''
                  }`}
                >
                  <span className={styles.ingredientName}>{ing.name}</span>
                  <span className={styles.ingredientAmount}>
                    {ing.amount} {ing.unit}
                  </span>
                </div>
              ))}
            </div>
            {meal.ingredients.some((i) => !i.inStock) && (
              <p className={styles.stockWarning}>
                ⚠️ 当前库存不足，请补充以上标记的食材
              </p>
            )}
          </div>
          <div className={styles.panelSection}>
            <h4 className={styles.panelSectionTitle}>👨‍🍳 制作步骤</h4>
            <ol className={styles.stepsList}>
              {meal.steps.map((step, i) => (
                <li key={i} className={styles.stepItem}>
                  <span className={styles.stepNumber}>{i + 1}</span>
                  <span className={styles.stepText}>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

const MealPlanPage = () => {
  const { mealPlan, settings, fetchMealPlan, fetchSettings, updateSettings, loading } =
    useFoodStore();
  const [activeGoal, setActiveGoal] = useState<GoalType>(settings.goalType || 'balanced');

  useEffect(() => {
    fetchSettings();
    fetchMealPlan();
  }, [fetchSettings, fetchMealPlan]);

  useEffect(() => {
    if (settings.goalType) {
      setActiveGoal(settings.goalType);
    }
  }, [settings.goalType]);

  const handleGoalChange = async (goal: GoalType) => {
    setActiveGoal(goal);
    await updateSettings({ goalType: goal });
    await fetchMealPlan(goal);
  };

  const goalKeys: GoalType[] = ['muscle', 'fatLoss', 'balanced'];
  const activeIndex = goalKeys.indexOf(activeGoal);

  const renderMealSection = (key: string, meals: Meal[], sectionIndex: number) => {
    const info = mealLabels[key];
    return (
      <section className={styles.mealSection} key={key}>
        <div className={styles.sectionHeader}>
          <span className={styles.sectionIcon}>{info.icon}</span>
          <h2 className={styles.sectionTitle}>{info.label}</h2>
        </div>
        {loading ? (
          <div className={styles.loading}>正在生成推荐...</div>
        ) : meals.length === 0 ? (
          <div className={styles.emptyMeals}>暂无推荐食谱</div>
        ) : (
          <div className={styles.mealsGrid}>
            {meals.map((meal, idx) => (
              <MealCard
                key={meal.id}
                meal={meal}
                index={idx}
                sectionIndex={sectionIndex}
              />
            ))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.pageTitle}>膳食推荐</h1>
          <p className={styles.pageSubtitle}>基于库存食材和营养目标智能推荐</p>
        </div>
      </header>

      <div className={styles.tabsContainer}>
        <div className={styles.tabs}>
          {goalKeys.map((goal) => (
            <button
              key={goal}
              className={`${styles.tab} ${activeGoal === goal ? styles.tabActive : ''}`}
              onClick={() => handleGoalChange(goal)}
            >
              {goalLabels[goal]}
            </button>
          ))}
          <div
            className={styles.tabIndicator}
            style={{
              transform: `translateX(${activeIndex * 100}%)`,
            }}
          />
        </div>
        <button className={styles.refreshBtn} onClick={() => fetchMealPlan(activeGoal)}>
          🔄 重新推荐
        </button>
      </div>

      <div className={styles.nutritionSummary}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>每日目标热量</span>
          <span className={styles.summaryValue}>{settings.dailyCalories} kcal</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>蛋白质</span>
          <span className={styles.summaryValue}>{settings.proteinRatio}%</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>脂肪</span>
          <span className={styles.summaryValue}>{settings.fatRatio}%</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>碳水</span>
          <span className={styles.summaryValue}>{settings.carbRatio}%</span>
        </div>
      </div>

      <div className={styles.mealsContainer}>
        {renderMealSection('breakfast', mealPlan.breakfast, 0)}
        {renderMealSection('lunch', mealPlan.lunch, 1)}
        {renderMealSection('dinner', mealPlan.dinner, 2)}
      </div>
    </div>
  );
};

export default MealPlanPage;
