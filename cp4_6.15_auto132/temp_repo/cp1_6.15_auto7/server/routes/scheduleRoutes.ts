import { Router } from 'express';
import * as svc from '../services/scheduleService.js';

const router = Router();

// Teachers
router.get('/teachers', (req, res) => res.json(svc.getAllTeachers()));
router.post('/teachers', (req, res) => res.status(201).json(svc.createTeacher(req.body)));
router.put('/teachers/:id', (req, res) => { const r = svc.updateTeacher(req.params.id, req.body); r ? res.json(r) : res.status(404).json({ error: 'Not found' }); });
router.delete('/teachers/:id', (req, res) => svc.deleteTeacher(req.params.id) ? res.json({ success: true }) : res.status(404).json({ error: 'Not found' }));
router.put('/teachers/:id/slots', (req, res) => { const r = svc.updateTeacherSlots(req.params.id, req.body.availableSlots); r ? res.json(r) : res.status(404).json({ error: 'Not found' }); });

// Courses
router.get('/courses', (req, res) => res.json(svc.getAllCourses()));
router.post('/courses', (req, res) => res.status(201).json(svc.createCourse(req.body)));
router.put('/courses/:id', (req, res) => { const r = svc.updateCourse(req.params.id, req.body); r ? res.json(r) : res.status(404).json({ error: 'Not found' }); });
router.delete('/courses/:id', (req, res) => svc.deleteCourse(req.params.id) ? res.json({ success: true }) : res.status(404).json({ error: 'Not found' }));

// Classrooms
router.get('/classrooms', (req, res) => res.json(svc.getAllClassrooms()));
router.post('/classrooms', (req, res) => res.status(201).json(svc.createClassroom(req.body)));
router.put('/classrooms/:id', (req, res) => { const r = svc.updateClassroom(req.params.id, req.body); r ? res.json(r) : res.status(404).json({ error: 'Not found' }); });
router.delete('/classrooms/:id', (req, res) => svc.deleteClassroom(req.params.id) ? res.json({ success: true }) : res.status(404).json({ error: 'Not found' }));

// Schedule
router.get('/schedule', (req, res) => res.json(svc.getAllSchedule()));
router.post('/schedule/auto', (req, res) => res.json(svc.autoSchedule()));
router.put('/schedule/move', (req, res) => res.json(svc.moveScheduleEntry(req.body.entryId, req.body.newDay, req.body.newStartSlot, req.body.newClassroomId)));
router.delete('/schedule/:id', (req, res) => svc.deleteScheduleEntry(req.params.id) ? res.json({ success: true }) : res.status(404).json({ error: 'Not found' }));
router.get('/schedule/classroom/:id/occupancy', (req, res) => res.json(svc.getClassroomOccupancy(req.params.id)));

export default router;
