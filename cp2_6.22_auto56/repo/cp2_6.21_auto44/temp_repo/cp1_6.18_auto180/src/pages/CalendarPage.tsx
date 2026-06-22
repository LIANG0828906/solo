import Calendar from '../components/Calendar';
import './CalendarPage.css';

export default function CalendarPage() {
  return (
    <div className="calendar-page">
      <h1 className="page-title">养护日历</h1>
      <div className="calendar-page-inner">
        <Calendar />
      </div>
    </div>
  );
}
