import { useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { RecipeCard } from '../recipes/components/RecipeCard';
import { GroceryChecklist } from './components/GroceryChecklist';
import { CollaboratorBar } from './components/CollaboratorBar';
import { useAppStore } from '@/store/useAppStore';
import { groupByCategory } from '@/utils/recipeParser';

export function ShoppingModule() {
  const {
    recipes,
    selectedRecipeIds,
    groceryItems,
    collaborators,
    currentUserId,
    toggleRecipeSelection,
    toggleGroceryItem,
    addGroceryItem,
    removeGroceryItem,
    simulateCollaboratorUpdate,
  } = useAppStore();

  const categoryGroups = useMemo(() => {
    return groupByCategory(groceryItems);
  }, [groceryItems]);

  const selectedRecipes = useMemo(() => {
    return recipes.filter((r) => selectedRecipeIds.includes(r.id));
  }, [recipes, selectedRecipeIds]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (Math.random() > 0.7 && groceryItems.length > 0) {
        simulateCollaboratorUpdate();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [groceryItems.length, simulateCollaboratorUpdate]);

  return (
    <div style={{
      padding: 24,
      minWidth: 0,
      flex: 1,
      overflow: 'auto',
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
    }}>
      <CollaboratorBar
        collaborators={collaborators}
        currentUserId={currentUserId}
      />

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 24,
        flex: 1,
        minHeight: 0,
      }}>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'auto',
        }}>
          <div style={{
            marginBottom: 16,
            position: 'sticky',
            top: 0,
            backgroundColor: '#FFF8F0',
            paddingTop: 4,
            paddingBottom: 8,
            zIndex: 10,
          }}>
            <h2 style={{
              margin: 0,
              fontSize: 18,
              fontWeight: 600,
              color: '#2C3E50',
            }}>
              本周计划烹饪
            </h2>
            <p style={{
              margin: '4px 0 0 0',
              fontSize: 13,
              color: '#7F8C8D',
            }}>
              已选择 {selectedRecipeIds.length} 道菜谱
            </p>
          </div>

          <motion.div
            layout
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 16,
              alignContent: 'flex-start',
            }}
          >
            {recipes.map((recipe) => (
              <div
                key={recipe.id}
                style={{
                  position: 'relative',
                  transform: 'scale(0.85)',
                  transformOrigin: 'top left',
                  width: 220,
                  height: 160,
                }}
              >
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    borderRadius: 16,
                    opacity: selectedRecipeIds.includes(recipe.id) ? 0 : 0.5,
                    backgroundColor: selectedRecipeIds.includes(recipe.id) ? 'transparent' : '#FFFFFF',
                    zIndex: 5,
                    pointerEvents: 'none',
                    transition: 'opacity 0.3s ease',
                  }}
                />
                <RecipeCard
                  recipe={recipe}
                  isSelected={selectedRecipeIds.includes(recipe.id)}
                  showCheckbox={true}
                  onToggle={() => toggleRecipeSelection(recipe.id)}
                  onClick={() => toggleRecipeSelection(recipe.id)}
                />
              </div>
            ))}
          </motion.div>
        </div>

        <div style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: 0,
          overflow: 'auto',
        }}>
          <GroceryChecklist
            groups={categoryGroups}
            onToggleItem={toggleGroceryItem}
            onAddItem={addGroceryItem}
            onRemoveItem={removeGroceryItem}
          />

          {selectedRecipes.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                marginTop: 16,
                padding: 16,
                backgroundColor: '#FFFFFF',
                borderRadius: 12,
                boxShadow: '0 2px 8px rgba(212, 197, 176, 0.3)',
              }}
            >
              <h3 style={{
                margin: '0 0 12px 0',
                fontSize: 14,
                fontWeight: 600,
                color: '#2C3E50',
              }}>
                清单来源菜谱
              </h3>
              <div style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 8,
              }}>
                {selectedRecipes.map((recipe) => (
                  <span
                    key={recipe.id}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '4px 10px 4px 4px',
                      borderRadius: 16,
                      backgroundColor: '#FFF8F0',
                      fontSize: 12,
                      color: '#7F8C8D',
                    }}
                  >
                    <span style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      backgroundColor: recipe.coverColor,
                    }} />
                    {recipe.name}
                  </span>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
