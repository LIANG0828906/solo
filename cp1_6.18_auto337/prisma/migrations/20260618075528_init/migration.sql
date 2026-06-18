-- CreateTable
CREATE TABLE "Recording" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "timestamp" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" REAL NOT NULL,
    "pitch" REAL NOT NULL,
    "energy" REAL NOT NULL,
    "zeroCrossingRate" REAL NOT NULL,
    "valence" REAL NOT NULL,
    "arousal" REAL NOT NULL,
    "emotionCategory" TEXT NOT NULL
);
