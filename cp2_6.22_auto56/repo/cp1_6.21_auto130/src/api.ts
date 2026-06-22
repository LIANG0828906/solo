import axios from 'axios';
import { PokemonData } from './types';

const API_BASE = '/api';

export async function fetchPokemonList(): Promise<PokemonData[]> {
  const res = await axios.get<PokemonData[]>(`${API_BASE}/pokemon`);
  return res.data;
}

export async function saveBattleRecord(record: {
  playerPokemon: string;
  aiPokemon: string;
  winner: string;
  rounds: number;
}): Promise<void> {
  await axios.post(`${API_BASE}/battle-history`, record);
}
