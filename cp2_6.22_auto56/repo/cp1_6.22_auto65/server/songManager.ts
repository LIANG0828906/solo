export interface NoteData {
  time: number;
  track: number;
  index: number;
}

export interface SongData {
  name: string;
  bpm: number;
  duration: number;
  notes: NoteData[];
}

function generateSong(): SongData {
  const bpm = 128;
  const beatInterval = 60000 / bpm;
  const duration = 90000;
  const notes: NoteData[] = [];
  
  const patterns = [
    [0], [1], [2], [3],
    [0, 2], [1, 3], [0, 1], [2, 3],
    [0], [1], [2], [3],
    [0, 3], [1, 2], [0, 1, 2], [1, 2, 3],
  ];

  let noteIndex = 0;
  let currentTime = beatInterval * 2;

  while (currentTime < duration - beatInterval * 4) {
    const patternIndex = Math.floor(Math.random() * patterns.length);
    const pattern = patterns[patternIndex];
    
    for (const track of pattern) {
      notes.push({
        time: currentTime,
        track,
        index: noteIndex++,
      });
    }
    
    const subDivisions = Math.random() > 0.6 ? 2 : 1;
    currentTime += beatInterval / subDivisions;
  }

  notes.sort((a, b) => a.time - b.time);
  notes.forEach((n, i) => n.index = i);

  return {
    name: "Cyber Rhythm",
    bpm,
    duration,
    notes,
  };
}

const songLibrary: SongData[] = [generateSong()];

export function getSong(songIndex: number = 0): SongData {
  return JSON.parse(JSON.stringify(songLibrary[songIndex % songLibrary.length]));
}

export function getSongCount(): number {
  return songLibrary.length;
}

export function getBpm(): number {
  return songLibrary[0].bpm;
}
