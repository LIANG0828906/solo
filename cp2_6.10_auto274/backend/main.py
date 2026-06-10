from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import json
import os

from matcher import FragmentMatcher

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

base_dir = os.path.dirname(os.path.abspath(__file__))

with open(os.path.join(base_dir, "data", "poems.json"), "r", encoding="utf-8") as f:
    poems = json.load(f)

with open(os.path.join(base_dir, "data", "fragments.json"), "r", encoding="utf-8") as f:
    fragments = json.load(f)

matcher = FragmentMatcher()

jingye_poem = next(p for p in poems if p["title"] == "静夜思")
correct_positions = [{"id": f["id"], "row": f["row"], "col": f["col"]} for f in fragments]


class MatchRequest(BaseModel):
    fragment: Dict
    placedFragments: List[Dict]


class ScoreRequest(BaseModel):
    placedFragments: List[Dict]
    totalTime: float
    totalMoves: int


@app.get("/api/fragments")
async def get_fragments():
    return {
        "fragments": fragments,
        "poem": jingye_poem
    }


@app.post("/api/match")
async def match_fragment(request: MatchRequest):
    matches = matcher.find_matches(request.fragment, request.placedFragments)
    best_match = matcher.calculate_best_match(request.fragment, request.placedFragments)
    return {
        "matches": matches,
        "bestMatch": best_match
    }


@app.post("/api/score")
async def calculate_score(request: ScoreRequest):
    score_result = matcher.calculate_final_score(
        request.placedFragments,
        request.totalTime,
        request.totalMoves,
        correct_positions
    )
    
    sorted_fragments = sorted(request.placedFragments, key=lambda x: (x["row"], x["col"]))
    completed_poem = []
    for row in range(4):
        line_chars = []
        for col in range(5):
            frag = next((f for f in sorted_fragments if f["row"] == row and f["col"] == col), None)
            if frag:
                line_chars.append(frag["text"])
            else:
                line_chars.append("□")
        completed_poem.append("".join(line_chars))
    
    return {
        **score_result,
        "completedPoem": completed_poem
    }
