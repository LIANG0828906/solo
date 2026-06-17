import { useEffect } from 'react'
import { useRecipeStore } from '@/client/RecipeManager'
import SearchBar from '@/components/SearchBar'
import RecipeCard from '@/components/RecipeCard'

function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl bg-white p-4 shadow-sm">
      <div className="h-40 rounded-xl bg-gray-200" />
      <div className="mt-3 h-5 w-3/4 rounded bg-gray-200" />
      <div className="mt-2 h-4 w-1/2 rounded bg-gray-200" />
      <div className="mt-2 flex gap-2">
        <div className="h-6 w-16 rounded-full bg-gray-200" />
        <div className="h-6 w-16 rounded-full bg-gray-200" />
      </div>
    </div>
  )
}

export default function Home() {
  const { recipes, loading, fetchRecipes } = useRecipeStore()

  useEffect(() => {
    fetchRecipes()
  }, [fetchRecipes])

  return (
    <div className="min-h-screen bg-[#FFF8F0] p-6 md:p-8">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-6 text-3xl font-bold text-[#8B4513]">发现美味菜谱</h1>
        <SearchBar />

        <div className="mt-8 transition-opacity duration-300">
          {loading ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : recipes.length === 0 ? (
            <div className="py-20 text-center text-[#8B4513]/60">
              <p className="text-lg">没有找到相关菜谱</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {recipes.map((recipe) => (
                <RecipeCard key={recipe.id} recipe={recipe} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
