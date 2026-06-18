import { useSurveyStore } from './store';
import SurveyList from './components/SurveyList';
import QuestionEditor from './components/QuestionEditor';
import ResponseViewer from './components/ResponseViewer';
import FillSurvey from './components/FillSurvey';

type RouteName =
  | 'LIST'
  | 'CREATE'
  | 'EDIT'
  | 'DETAIL'
  | 'FILL';

function getRouteName(currentRoute: string, hasId: boolean): RouteName {
  switch (currentRoute) {
    case '/':
      return 'LIST';
    case '/survey-create':
    case '/create':
      return 'CREATE';
    case '/survey-edit':
    case '/edit':
      return 'EDIT';
    case '/survey-detail':
    case '/detail':
      return 'DETAIL';
    case '/fill':
      return 'FILL';
    default:
      return hasId ? 'DETAIL' : 'LIST';
  }
}

export default function App() {
  const { currentRoute, routeParams } = useSurveyStore();
  const hasId = !!routeParams.id;
  const routeName = getRouteName(currentRoute, hasId);

  let PageComponent: React.ReactNode;

  switch (routeName) {
    case 'CREATE':
    case 'EDIT':
      PageComponent = <QuestionEditor />;
      break;
    case 'DETAIL':
      PageComponent = <ResponseViewer />;
      break;
    case 'FILL':
      PageComponent = <FillSurvey />;
      break;
    case 'LIST':
    default:
      PageComponent = <SurveyList />;
  }

  return (
    <div className="min-h-screen bg-secondary">
      <div className="fade-in-slow" key={`${currentRoute}-${routeParams.id || ''}`}>
        {PageComponent}
      </div>
    </div>
  );
}
