import { v4 as uuidv4 } from 'uuid';

export interface ArtworkComment {
  id: string;
  text: string;
  timestamp: number;
}

export interface Artwork {
  id: string;
  title: string;
  dimensions: string;
  year: string;
  imageBase64: string;
  likes: number;
  comments: ArtworkComment[];
}

export interface ArtworkListItem {
  id: string;
  title: string;
  dimensions: string;
  year: string;
  imageBase64: string;
  likes: number;
  commentCount: number;
}

export interface VisitorInfo {
  id: string;
  position: { x: number; y: number; z: number };
}

export const artworks: Map<string, Artwork> = new Map();
export const onlineVisitors: Map<string, VisitorInfo> = new Map();

export function addArtwork(
  title: string,
  dimensions: string,
  year: string,
  imageBase64: string
): Artwork {
  const artwork: Artwork = {
    id: uuidv4(),
    title,
    dimensions,
    year,
    imageBase64,
    likes: 0,
    comments: [],
  };
  artworks.set(artwork.id, artwork);
  return artwork;
}

export function getAllArtworks(): ArtworkListItem[] {
  return Array.from(artworks.values()).map((a) => ({
    id: a.id,
    title: a.title,
    dimensions: a.dimensions,
    year: a.year,
    imageBase64: a.imageBase64,
    likes: a.likes,
    commentCount: a.comments.length,
  }));
}

export function likeArtwork(id: string): number | null {
  const artwork = artworks.get(id);
  if (!artwork) return null;
  artwork.likes += 1;
  return artwork.likes;
}

export function addComment(artworkId: string, text: string): ArtworkComment | null {
  const artwork = artworks.get(artworkId);
  if (!artwork) return null;
  const comment: ArtworkComment = {
    id: uuidv4(),
    text,
    timestamp: Date.now(),
  };
  artwork.comments.push(comment);
  return comment;
}

export function getComments(artworkId: string): ArtworkComment[] | null {
  const artwork = artworks.get(artworkId);
  if (!artwork) return null;
  return artwork.comments;
}

export function addVisitor(id: string): void {
  onlineVisitors.set(id, { id, position: { x: 0, y: 0, z: 0 } });
}

export function removeVisitor(id: string): void {
  onlineVisitors.delete(id);
}

export function updateVisitorPosition(
  id: string,
  x: number,
  y: number,
  z: number
): void {
  const visitor = onlineVisitors.get(id);
  if (visitor) {
    visitor.position = { x, y, z };
  }
}

export function getVisitors(): VisitorInfo[] {
  return Array.from(onlineVisitors.values());
}

const redSquareBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAABl0RVh0U29mdHdhbmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAGSSURBVHic7dxBDoMwDAXAv+T9dg5askzYOXDY0MEKJaJEc6T4XgDs5fF4LBa8efPmzdv9+/f3P8T/wP/Af2H8D6z/hP0fWP8J+38grF8IxheC8Y1gfCMY3wjGN4LxjWB8IxjfCMY3gvGNYHwjGN8IxjeC8Y1gfCMY3wjGN4LxjWB8IxjfCMY3gvGNYHwjGN8IxjeC8Y1gfCMY3wjGN4LxjWB8IxjfCMY3gvGN8L9HBDvA8t7gXFvAsU7g3FvAsU7g3FvAsU7g3FvAsU7g3FvAsU7g3FvAsU7g3FvAsU7g3FvAsU7g3FvAsU7g3FvAsU7g3FvAsU7g3FvAsU7g3FvAsU7g3FvAsU7g3FvAsU7g3FvAsU7g3FvAsU7g3FvAsU7g3FvAsU7g3FvAsU7g3FvAsU7g3FvAsU7g3FvAsU7g3FvAsU7g3FvAsU7w3/R1eEecq17PwAAAABJRU5ErkJggg==';

const blueSquareBase64 =
  'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAALEwAACxMBAJqcGAAAABl0RVh0U29mdHdhbmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAJJSURBVHic7dxBDsIwDAXAv+T9dg6m5JDsHCcLmqyQIpk6R/o+ALCXx+O5PPl8/Pr19fPnj9+/f/9C/E/4B/wPjP/B+g+y/4Psv2D/B8f9hWN8IxjfCMY3gvGN8L9HBDvB8l5gvC8w3heY7wvM54XWeYHxvsB4X2C8LzDeF5gfC8z3BeZ7AvN9gfm+wHxfYL4vMN8XmO8LzPcF5vsC832B+b7AfF9gvi8w3xeY7wvM9wXm+wLzfYH5vsB8X2C+LzDfF5jvC8z3Beb7AvN9gfm+wHxfYL4vMN8XmO8LzPcF5vsC832B+b7AfF9gvi8w3xeY7wvM9wXm+wLzfYH5vsB8X2C+LzDfF5jvC8z3Beb7AvN9gfm+wHxfYL4vMN8XmO8LzPcF5vsC832B+b7AfF9gvi8w3xeY7wvM9wXm+wLzfYH5vsB8X2A+N4j3BeZ7g3jfJ5DfP4DgTQAAAABJRU5ErkJggg==';

addArtwork(
  'Sunset Horizon',
  '80x60 cm',
  '2023',
  `data:image/png;base64,${redSquareBase64}`
);

addArtwork(
  'Ocean Dreams',
  '100x70 cm',
  '2022',
  `data:image/png;base64,${blueSquareBase64}`
);
