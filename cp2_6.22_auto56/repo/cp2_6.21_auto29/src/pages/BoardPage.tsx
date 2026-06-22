import Board from '../components/Board/Board';
import Timeline from '../components/Timeline/Timeline';

function BoardPage() {
  return (
    <>
      <div className="board-wrapper">
        <Board />
      </div>
      <div className="timeline-wrapper">
        <h2 className="timeline-title">项目时间线</h2>
        <Timeline />
      </div>
    </>
  );
}

export default BoardPage;
