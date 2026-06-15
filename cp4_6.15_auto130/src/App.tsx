import React, { useState, useCallback, useEffect } from 'react';
import MapEditor from './modules/MapEditor';
import Simulator from './modules/Simulator';
import { exportToJSON, triggerDownload } from './modules/Exporter';
import {
  TILE_DEFS,
  GRID_WIDTH,
  GRID_HEIGHT,
  CELL_SIZE,
  getSampleMap,
  type PlacedTile,
  type CollisionRect,
