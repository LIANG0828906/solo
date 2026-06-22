import { useParams } from 'react-router-dom';
import RecipeDetailComponent from '../components/RecipeDetail';

export default function RecipeDetail() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <div>食谱不存在</div>;
  }

  return <RecipeDetailComponent id={id} />;
}
