#!/bin/bash

cd src/server && uvicorn backend:app --reload --port 8000 &
cd ../../ && npm run dev
