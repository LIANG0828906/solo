import uuid
import json
import colorsys
from datetime import datetime, date as date_type, timedelta
from typing import List, Dict, Optional
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from pydantic import BaseModel
import socketio

sio = socketio.AsyncServer(async_mode='asgi', cors_allowed_origins='*')
app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=['*'],
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)

GOLDEN_ANGLE = 137.508

polls: Dict[str, dict] = {}
user_colors: Dict[str, str] = {}


class TimeSlotCreate(BaseModel):
    date: str
    startTime: str
    endTime: str


class CreatePollRequest(BaseModel):
    title: str
    description: str
    timeSlots: List[TimeSlotCreate]


class SubmitVoteRequest(BaseModel):
    userName: str
    availableSlotIds: List[str]


class ClosePollRequest(BaseModel):
    adminToken: str


def _hash_code(s: str) -> int:
    h = 0
    for ch in s:
        h = ord(ch) + ((h << 5) - h)
    return abs(h)


def _hsl_to_hex(h: float, s: float, l: float) -> str:
    s /= 100.0
    l /= 100.0
    r, g, b = colorsys.hls_to_rgb(h / 360.0, l, s)
    return '#{:02x}{:02x}{:02x}'.format(int(r * 255), int(g * 255), int(b * 255))


def get_user_color(user_name: str) -> str:
    if user_name not in user_colors:
        base_hash = _hash_code(user_name)
        hue = (base_hash * GOLDEN_ANGLE) % 360.0
        saturation_variation = (base_hash % 20) - 10
        saturation = max(60, min(85, 70 + saturation_variation))
        lightness_variation = (base_hash % 15) - 7
        lightness = max(45, min(65, 55 + lightness_variation))
        user_colors[user_name] = _hsl_to_hex(hue, saturation, lightness)
    return user_colors[user_name]


def parse_time(time_str: str) -> timedelta:
    h, m = map(int, time_str.split(':'))
    return timedelta(hours=h, minutes=m)


def compute_best_time(poll_data: dict):
    if not poll_data['votes']:
        return None

    time_slots = poll_data['time_slots']
    votes = poll_data['votes']
    total_participants = len(votes)

    if total_participants == 0:
        return None

    slot_vote_counts: Dict[str, int] = {}
    for slot in time_slots:
        slot_vote_counts[slot['id']] = 0

    for vote in votes:
        for slot_id in vote['availableSlotIds']:
            if slot_id in slot_vote_counts:
                slot_vote_counts[slot_id] += 1

    best_slot_id = None
    best_count = 0
    for slot_id, count in slot_vote_counts.items():
        if count > best_count:
            best_count = count
            best_slot_id = slot_id

    if best_slot_id is None:
        return None

    best_slot = next((s for s in time_slots if s['id'] == best_slot_id), None)
    if best_slot is None:
        return None

    coverage = best_count / total_participants if total_participants > 0 else 0
    min_coverage = 0.5
    min_duration_hours = 1

    start_td = parse_time(best_slot['startTime'])
    end_td = parse_time(best_slot['endTime'])
    duration_hours = (end_td - start_td).total_seconds() / 3600

    if coverage >= min_coverage and duration_hours >= min_duration_hours:
        return {
            'date': best_slot['date'],
            'startTime': best_slot['startTime'],
            'endTime': best_slot['endTime'],
            'coverage': round(coverage, 2),
            'participantCount': best_count,
            'totalParticipants': total_participants,
        }

    sorted_slots = sorted(slot_vote_counts.items(), key=lambda x: x[1], reverse=True)
    for slot_id, count in sorted_slots:
        slot = next((s for s in time_slots if s['id'] == slot_id), None)
        if slot is None:
            continue
        cov = count / total_participants
        s_td = parse_time(slot['startTime'])
        e_td = parse_time(slot['endTime'])
        dur = (e_td - s_td).total_seconds() / 3600
        if dur >= min_duration_hours:
            return {
                'date': slot['date'],
                'startTime': slot['startTime'],
                'endTime': slot['endTime'],
                'coverage': round(cov, 2),
                'participantCount': count,
                'totalParticipants': total_participants,
            }

    if sorted_slots:
        slot_id, count = sorted_slots[0]
        slot = next((s for s in time_slots if s['id'] == slot_id), None)
        if slot:
            cov = count / total_participants
            return {
                'date': slot['date'],
                'startTime': slot['startTime'],
                'endTime': slot['endTime'],
                'coverage': round(cov, 2),
                'participantCount': count,
                'totalParticipants': total_participants,
            }

    return None


@app.post('/api/polls')
async def create_poll(request: CreatePollRequest):
    poll_id = str(uuid.uuid4())[:8]
    admin_token = str(uuid.uuid4())[:12]

    time_slots = []
    for idx, slot in enumerate(request.timeSlots):
        time_slots.append({
            'id': f'slot_{idx}',
            'date': slot.date,
            'startTime': slot.startTime,
            'endTime': slot.endTime,
        })

    poll_data = {
        'id': poll_id,
        'title': request.title,
        'description': request.description,
        'timeSlots': time_slots,
        'votes': [],
        'isClosed': False,
        'createdAt': datetime.now().isoformat(),
        'adminToken': admin_token,
    }

    polls[poll_id] = poll_data
    return poll_data


@app.get('/api/polls/{poll_id}')
async def get_poll(poll_id: str):
    if poll_id not in polls:
        raise HTTPException(status_code=404, detail='Poll not found')
    poll = polls[poll_id]
    return {
        'id': poll['id'],
        'title': poll['title'],
        'description': poll['description'],
        'timeSlots': poll['timeSlots'],
        'votes': poll['votes'],
        'isClosed': poll['isClosed'],
        'createdAt': poll['createdAt'],
    }


@app.post('/api/polls/{poll_id}/votes')
async def submit_vote(poll_id: str, request: SubmitVoteRequest):
    if poll_id not in polls:
        raise HTTPException(status_code=404, detail='Poll not found')

    poll = polls[poll_id]
    if poll['isClosed']:
        raise HTTPException(status_code=400, detail='Poll is closed')

    user_color = get_user_color(request.userName)

    existing_idx = None
    for i, v in enumerate(poll['votes']):
        if v['userName'] == request.userName:
            existing_idx = i
            break

    vote_id = str(uuid.uuid4())[:8]
    vote_data = {
        'id': vote_id,
        'pollId': poll_id,
        'userName': request.userName,
        'userColor': user_color,
        'availableSlotIds': request.availableSlotIds,
        'createdAt': datetime.now().isoformat(),
    }

    if existing_idx is not None:
        poll['votes'][existing_idx] = vote_data
    else:
        poll['votes'].append(vote_data)

    await sio.emit('new_vote', {'pollId': poll_id, 'vote': vote_data}, room=poll_id)
    await sio.emit('poll_updated', {'pollId': poll_id, 'poll': poll}, room=poll_id)

    return vote_data


@app.get('/api/polls/{poll_id}/best-time')
async def get_best_time(poll_id: str):
    if poll_id not in polls:
        raise HTTPException(status_code=404, detail='Poll not found')

    best = compute_best_time(polls[poll_id])
    if best is None:
        raise HTTPException(status_code=404, detail='No best time found')
    return best


@app.post('/api/polls/{poll_id}/close')
async def close_poll(poll_id: str, request: ClosePollRequest):
    if poll_id not in polls:
        raise HTTPException(status_code=404, detail='Poll not found')

    poll = polls[poll_id]
    if poll['adminToken'] != request.adminToken:
        raise HTTPException(status_code=403, detail='Invalid admin token')

    poll['isClosed'] = True
    await sio.emit('poll_updated', {'pollId': poll_id, 'poll': poll}, room=poll_id)

    return poll


@app.get('/api/polls/{poll_id}/export')
async def export_poll(poll_id: str):
    if poll_id not in polls:
        raise HTTPException(status_code=404, detail='Poll not found')

    poll = polls[poll_id]
    best = compute_best_time(poll)

    if best is None and poll['timeSlots']:
        slot = poll['timeSlots'][0]
        start_datetime = f"{slot['date']}T{slot['startTime']}:00"
        end_datetime = f"{slot['date']}T{slot['endTime']}:00"
    elif best:
        start_datetime = f"{best['date']}T{best['startTime']}:00"
        end_datetime = f"{best['date']}T{best['endTime']}:00"
    else:
        raise HTTPException(status_code=400, detail='No time slots available')

    def format_ical_datetime(dt_str: str) -> str:
        dt = datetime.fromisoformat(dt_str)
        return dt.strftime('%Y%m%dT%H%M%SZ')

    ical_content = f"""BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Poll App//EN
BEGIN:VEVENT
UID:{poll['id']}@poll.app
DTSTAMP:{format_ical_datetime(datetime.now().isoformat())}
DTSTART:{format_ical_datetime(start_datetime)}
DTEND:{format_ical_datetime(end_datetime)}
SUMMARY:{poll['title']}
DESCRIPTION:{poll['description']}
END:VEVENT
END:VCALENDAR
"""

    return Response(
        content=ical_content,
        media_type='text/calendar',
        headers={
            'Content-Disposition': f'attachment; filename="{poll["title"]}.ics"'
        }
    )


@sio.event
async def connect(sid, environ):
    print(f'Client connected: {sid}')


@sio.event
async def disconnect(sid):
    print(f'Client disconnected: {sid}')


@sio.event
async def join_poll(sid, data):
    poll_id = data.get('pollId')
    if poll_id:
        sio.enter_room(sid, poll_id)
        print(f'Client {sid} joined poll {poll_id}')


socketio_app = socketio.ASGIApp(sio, app)
