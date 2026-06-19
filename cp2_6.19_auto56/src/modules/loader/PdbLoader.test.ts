import { describe, it, expect } from 'vitest'
import { PdbLoader } from './PdbLoader'

const VALID_PDB = [
  'HEADER    TEST PROTEIN',
  'ATOM      1  N   MET A   1      10.000  20.000  30.000  1.00 20.00           N',
  'ATOM      2  CA  MET A   1      11.000  21.000  31.000  1.00 20.00           C',
  'ATOM      3  C   MET A   1      12.000  22.000  32.000  1.00 20.00           C',
  'ATOM      4  O   MET A   1      13.000  23.000  33.000  1.00 20.00           O',
  'ATOM      5  N   GLY B   2      14.000  24.000  34.000  1.00 15.00           N',
  'ATOM      6  CA  GLY B   2      15.000  25.000  35.000  1.00 15.00           C',
  'END'
].map(line => line.padEnd(80)).join('\n')

describe('PdbLoader', () => {
  describe('validate', () => {
    it('returns invalid for empty content', () => {
      const loader = new PdbLoader()
      const result = loader.validate('')
      expect(result.valid).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('returns invalid for whitespace-only content', () => {
      const loader = new PdbLoader()
      const result = loader.validate('   \n  \n  ')
      expect(result.valid).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('returns invalid for content with no ATOM records', () => {
      const loader = new PdbLoader()
      const result = loader.validate('HEADER    TEST\nTITLE     SOME TITLE\n')
      expect(result.valid).toBe(false)
      expect(result.error).toContain('ATOM')
    })

    it('returns invalid for ATOM records with column count < 66', () => {
      const loader = new PdbLoader()
      const shortAtom = 'ATOM      1  N   MET A   1'
      const pdb = `HEADER    TEST\n${shortAtom}\n`
      const result = loader.validate(pdb)
      expect(result.valid).toBe(false)
      expect(result.error).toBeTruthy()
    })

    it('returns valid for proper PDB content', () => {
      const loader = new PdbLoader()
      const result = loader.validate(VALID_PDB)
      expect(result.valid).toBe(true)
      expect(result.error).toBeNull()
    })
  })

  describe('parse', () => {
    it('returns structured data with correct atom count for valid PDB', () => {
      const loader = new PdbLoader()
      const result = loader.parse(VALID_PDB)
      expect(result.success).toBe(true)
      expect(result.data).not.toBeNull()
      expect(result.data!.atoms).toHaveLength(6)
    })

    it('returns error for invalid PDB', () => {
      const loader = new PdbLoader()
      const result = loader.parse('')
      expect(result.success).toBe(false)
      expect(result.data).toBeNull()
      expect(result.error).toBeTruthy()
    })

    it('correctly extracts atom coordinates, residue name, chain id', () => {
      const loader = new PdbLoader()
      const result = loader.parse(VALID_PDB)
      expect(result.success).toBe(true)
      const atoms = result.data!.atoms

      const atom1 = atoms[0]
      expect(atom1.x).toBeCloseTo(10.0)
      expect(atom1.y).toBeCloseTo(20.0)
      expect(atom1.z).toBeCloseTo(30.0)

      const atom5 = atoms[4]
      expect(atom5.chainId).toBe('B')

      const residues = result.data!.residues
      const metResidue = residues.find(r => r.chainId === 'A' && r.seqNum === 1)
      expect(metResidue).toBeDefined()
      expect(metResidue!.name).toBe('MET')

      const glyResidue = residues.find(r => r.chainId === 'B' && r.seqNum === 2)
      expect(glyResidue).toBeDefined()
      expect(glyResidue!.name).toBe('GLY')
    })

    it('generates unique sequential atom ids starting from 0', () => {
      const loader = new PdbLoader()
      const result = loader.parse(VALID_PDB)
      expect(result.success).toBe(true)
      const atoms = result.data!.atoms

      for (let i = 0; i < atoms.length; i++) {
        expect(atoms[i].id).toBe(i)
      }
    })

    it('generates uid from chainId, residueId, name and serial', () => {
      const loader = new PdbLoader()
      const result = loader.parse(VALID_PDB)
      expect(result.success).toBe(true)
      const atoms = result.data!.atoms

      expect(atoms[0].uid).toBe('A:1:N:1')
      expect(atoms[1].uid).toBe('A:1:CA:2')
      expect(atoms[4].uid).toBe('B:2:N:5')
    })

    it('populates serial from PDB atom serial number field', () => {
      const loader = new PdbLoader()
      const result = loader.parse(VALID_PDB)
      expect(result.success).toBe(true)
      const atoms = result.data!.atoms

      expect(atoms[0].serial).toBe(1)
      expect(atoms[1].serial).toBe(2)
      expect(atoms[5].serial).toBe(6)
    })

    it('correctly parses chains', () => {
      const loader = new PdbLoader()
      const result = loader.parse(VALID_PDB)
      expect(result.success).toBe(true)
      expect(result.data!.chains).toEqual(['A', 'B'])
    })

    it('calculates residue centers as average of atom positions', () => {
      const loader = new PdbLoader()
      const result = loader.parse(VALID_PDB)
      expect(result.success).toBe(true)

      const metResidue = result.data!.residues.find(
        r => r.chainId === 'A' && r.seqNum === 1
      )!
      expect(metResidue.center.x).toBeCloseTo(
        (10 + 11 + 12 + 13) / 4
      )
      expect(metResidue.center.y).toBeCloseTo(
        (20 + 21 + 22 + 23) / 4
      )
      expect(metResidue.center.z).toBeCloseTo(
        (30 + 31 + 32 + 33) / 4
      )
    })

    it('handles HETATM records', () => {
      const loader = new PdbLoader()
      const pdb = [
        'HEADER    TEST',
        'HETATM    1  FE  HEM A   1      10.000  20.000  30.000  1.00 20.00          FE',
        'END'
      ].map(line => line.padEnd(80)).join('\n')
      const result = loader.parse(pdb)
      expect(result.success).toBe(true)
      expect(result.data!.atoms).toHaveLength(1)
      expect(result.data!.atoms[0].element).toBe('FE')
    })
  })
})
