import { describe, it, expect, beforeEach } from 'vitest'
import { useDocStore } from '../useDocStore'
import type { Annotation } from '../../types'

const mockAnnotation = (overrides: Partial<Annotation> = {}): Annotation => ({
  id: 'ann-1',
  userId: 'user-1',
  userName: 'Test User',
  paragraphIndex: 0,
  color: '#ff6b6b',
  text: 'Test annotation',
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

describe('useDocStore', () => {
  beforeEach(() => {
    useDocStore.setState({
      user: null,
      token: null,
      isAuthenticated: false,
      documentId: null,
      content: '',
      paragraphs: [],
      annotations: [],
      snapshots: [],
      currentSnapshotIndex: -1,
      isFading: false,
    })
  })

  describe('addAnnotation', () => {
    it('should add a valid annotation to the store', () => {
      const annotation = mockAnnotation()
      useDocStore.getState().addAnnotation(annotation)

      const state = useDocStore.getState()
      expect(state.annotations).toHaveLength(1)
      expect(state.annotations[0]).toEqual(annotation)
    })

    it('should sanitize invalid color to default color', () => {
      const annotation = mockAnnotation({ color: '#invalidcolor' })
      useDocStore.getState().addAnnotation(annotation)

      const state = useDocStore.getState()
      expect(state.annotations).toHaveLength(1)
      expect(state.annotations[0].color).toBe('#ff6b6b')
    })

    it('should keep valid color unchanged', () => {
      const annotation = mockAnnotation({ color: '#4d96ff' })
      useDocStore.getState().addAnnotation(annotation)

      const state = useDocStore.getState()
      expect(state.annotations[0].color).toBe('#4d96ff')
    })

    it('should add multiple annotations', () => {
      const ann1 = mockAnnotation({ id: 'ann-1' })
      const ann2 = mockAnnotation({ id: 'ann-2', paragraphIndex: 1 })
      useDocStore.getState().addAnnotation(ann1)
      useDocStore.getState().addAnnotation(ann2)

      const state = useDocStore.getState()
      expect(state.annotations).toHaveLength(2)
    })
  })

  describe('deleteAnnotation', () => {
    it('should remove the annotation with given id', () => {
      const ann1 = mockAnnotation({ id: 'ann-1' })
      const ann2 = mockAnnotation({ id: 'ann-2', paragraphIndex: 1 })
      useDocStore.getState().addAnnotation(ann1)
      useDocStore.getState().addAnnotation(ann2)

      useDocStore.getState().deleteAnnotation('ann-1')

      const state = useDocStore.getState()
      expect(state.annotations).toHaveLength(1)
      expect(state.annotations[0].id).toBe('ann-2')
    })

    it('should not affect other annotations when deleting non-existent id', () => {
      const ann = mockAnnotation()
      useDocStore.getState().addAnnotation(ann)

      useDocStore.getState().deleteAnnotation('non-existent')

      const state = useDocStore.getState()
      expect(state.annotations).toHaveLength(1)
    })
  })

  describe('clearParagraphAnnotations', () => {
    it('should remove all annotations for the specified paragraph', () => {
      const ann1 = mockAnnotation({ id: 'ann-1', paragraphIndex: 0 })
      const ann2 = mockAnnotation({ id: 'ann-2', paragraphIndex: 0 })
      const ann3 = mockAnnotation({ id: 'ann-3', paragraphIndex: 1 })
      useDocStore.getState().addAnnotation(ann1)
      useDocStore.getState().addAnnotation(ann2)
      useDocStore.getState().addAnnotation(ann3)

      useDocStore.getState().clearParagraphAnnotations(0)

      const state = useDocStore.getState()
      expect(state.annotations).toHaveLength(1)
      expect(state.annotations[0].id).toBe('ann-3')
    })

    it('should not affect other paragraphs', () => {
      const ann1 = mockAnnotation({ paragraphIndex: 0 })
      const ann2 = mockAnnotation({ paragraphIndex: 2, color: '#6bcb77' })
      useDocStore.getState().addAnnotation(ann1)
      useDocStore.getState().addAnnotation(ann2)

      useDocStore.getState().clearParagraphAnnotations(0)

      const state = useDocStore.getState()
      expect(state.annotations).toHaveLength(1)
      expect(state.annotations[0].paragraphIndex).toBe(2)
    })
  })

  describe('updateAnnotations', () => {
    it('should replace all annotations with validated list', () => {
      const ann1 = mockAnnotation({ id: 'ann-1' })
      useDocStore.getState().addAnnotation(ann1)

      const newAnnotations = [
        mockAnnotation({ id: 'ann-2', color: '#ffd93d' }),
        mockAnnotation({ id: 'ann-3', color: '#invalid', paragraphIndex: 1 }),
      ]
      useDocStore.getState().updateAnnotations(newAnnotations)

      const state = useDocStore.getState()
      expect(state.annotations).toHaveLength(2)
      expect(state.annotations[0].color).toBe('#ffd93d')
      expect(state.annotations[1].color).toBe('#ff6b6b')
    })
  })

  describe('restoreAnnotations', () => {
    it('should restore a previous snapshot of annotations', () => {
      const ann1 = mockAnnotation({ id: 'ann-1' })
      const ann2 = mockAnnotation({ id: 'ann-2', paragraphIndex: 1 })
      useDocStore.getState().addAnnotation(ann1)
      useDocStore.getState().addAnnotation(ann2)

      const snapshot = [ann1]
      useDocStore.getState().restoreAnnotations(snapshot)

      const state = useDocStore.getState()
      expect(state.annotations).toHaveLength(1)
      expect(state.annotations[0].id).toBe('ann-1')
    })
  })

  describe('color validation', () => {
    it('should accept all four valid colors', () => {
      const colors = ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff']
      colors.forEach((color, i) => {
        useDocStore.getState().addAnnotation(mockAnnotation({ id: `ann-${i}`, color }))
      })

      const state = useDocStore.getState()
      expect(state.annotations).toHaveLength(4)
      expect(state.annotations.map((a) => a.color)).toEqual(colors)
    })

    it('should sanitize random hex color to default', () => {
      const annotation = mockAnnotation({ color: '#abcdef' })
      useDocStore.getState().addAnnotation(annotation)

      const state = useDocStore.getState()
      expect(state.annotations[0].color).toBe('#ff6b6b')
    })

    it('should sanitize empty string color to default', () => {
      const annotation = mockAnnotation({ color: '' })
      useDocStore.getState().addAnnotation(annotation)

      const state = useDocStore.getState()
      expect(state.annotations[0].color).toBe('#ff6b6b')
    })
  })

  describe('setDocument', () => {
    it('should set document fields correctly', () => {
      useDocStore.getState().setDocument({
        id: 'doc-1',
        content: 'Hello world',
        paragraphs: ['Hello', 'world'],
      })

      const state = useDocStore.getState()
      expect(state.documentId).toBe('doc-1')
      expect(state.content).toBe('Hello world')
      expect(state.paragraphs).toEqual(['Hello', 'world'])
    })
  })

  describe('setUser and logout', () => {
    it('should set user and mark as authenticated', () => {
      useDocStore.getState().setUser(
        { id: 'u1', email: 'test@test.com', name: 'Test' },
        'token-abc'
      )

      const state = useDocStore.getState()
      expect(state.isAuthenticated).toBe(true)
      expect(state.user?.email).toBe('test@test.com')
      expect(state.token).toBe('token-abc')
    })

    it('should clear user on logout', () => {
      useDocStore.getState().setUser(
        { id: 'u1', email: 'test@test.com', name: 'Test' },
        'token-abc'
      )
      useDocStore.getState().logout()

      const state = useDocStore.getState()
      expect(state.isAuthenticated).toBe(false)
      expect(state.user).toBeNull()
      expect(state.token).toBeNull()
    })
  })

  describe('setFading', () => {
    it('should set fading state', () => {
      useDocStore.getState().setFading(true)
      expect(useDocStore.getState().isFading).toBe(true)

      useDocStore.getState().setFading(false)
      expect(useDocStore.getState().isFading).toBe(false)
    })
  })

  describe('setSnapshots and rollbackToSnapshot', () => {
    it('should set snapshots and default to latest index', () => {
      useDocStore.getState().setSnapshots([
        { id: 's1', createdAt: '2026-01-01T00:00:00Z', version: 1 },
        { id: 's2', createdAt: '2026-01-02T00:00:00Z', version: 2 },
        { id: 's3', createdAt: '2026-01-03T00:00:00Z', version: 3 },
      ])

      const state = useDocStore.getState()
      expect(state.snapshots).toHaveLength(3)
      expect(state.currentSnapshotIndex).toBe(2)
    })

    it('should rollback to specified snapshot index', () => {
      useDocStore.getState().setSnapshots([
        { id: 's1', createdAt: '2026-01-01T00:00:00Z', version: 1 },
        { id: 's2', createdAt: '2026-01-02T00:00:00Z', version: 2 },
      ])

      useDocStore.getState().rollbackToSnapshot(0)
      expect(useDocStore.getState().currentSnapshotIndex).toBe(0)
    })
  })
})
