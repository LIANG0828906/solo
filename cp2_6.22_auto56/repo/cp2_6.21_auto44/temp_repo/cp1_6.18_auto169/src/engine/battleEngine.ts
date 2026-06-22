import { PetInstance, calculatePower } from '@/data/petData';

export interface BattleRound {
  round: number;
  attackerUid: string;
  defenderUid: string;
  damage: number;
  defenderHpLeft: number;
}

export interface BattleResult {
  winnerUid: string | null;
  loserUid: string | null;
  rounds: BattleRound[];
  isDraw: boolean;
  rewardPoints: number;
}

function calcDamage(attacker: PetInstance): number {
  const base = attacker.attack * (0.8 + Math.random() * 0.4);
  const speedBonus = attacker.speed * 0.1;
  return Math.round(base + speedBonus);
}

export function simulateBattle(
  myPet: PetInstance,
  opponentPet: PetInstance
): BattleResult {
  let myHp = myPet.hp;
  let oppHp = opponentPet.hp;
  const rounds: BattleRound[] = [];
  let roundNum = 0;
  const maxRounds = 20;

  while (myHp > 0 && oppHp > 0 && roundNum < maxRounds) {
    roundNum++;
    const myFirst = myPet.speed >= opponentPet.speed;

    if (myFirst) {
      const dmg = calcDamage(myPet);
      oppHp = Math.max(0, oppHp - dmg);
      rounds.push({
        round: roundNum,
        attackerUid: myPet.uid,
        defenderUid: opponentPet.uid,
        damage: dmg,
        defenderHpLeft: oppHp,
      });
      if (oppHp <= 0) break;

      const dmg2 = calcDamage(opponentPet);
      myHp = Math.max(0, myHp - dmg2);
      rounds.push({
        round: roundNum,
        attackerUid: opponentPet.uid,
        defenderUid: myPet.uid,
        damage: dmg2,
        defenderHpLeft: myHp,
      });
    } else {
      const dmg = calcDamage(opponentPet);
      myHp = Math.max(0, myHp - dmg);
      rounds.push({
        round: roundNum,
        attackerUid: opponentPet.uid,
        defenderUid: myPet.uid,
        damage: dmg,
        defenderHpLeft: myHp,
      });
      if (myHp <= 0) break;

      const dmg2 = calcDamage(myPet);
      oppHp = Math.max(0, oppHp - dmg2);
      rounds.push({
        round: roundNum,
        attackerUid: myPet.uid,
        defenderUid: opponentPet.uid,
        damage: dmg2,
        defenderHpLeft: oppHp,
      });
    }
  }

  const isDraw = myHp <= 0 && oppHp <= 0;
  let winnerUid: string | null = null;
  let loserUid: string | null = null;

  if (!isDraw) {
    if (myHp > 0) {
      winnerUid = myPet.uid;
      loserUid = opponentPet.uid;
    } else {
      winnerUid = opponentPet.uid;
      loserUid = myPet.uid;
    }
  }

  const rewardPoints = winnerUid === myPet.uid ? 50 : 10;

  return { winnerUid, loserUid, rounds, isDraw, rewardPoints };
}

export function generateOpponentPet(myPet: PetInstance): PetInstance {
  const offset = (Math.random() - 0.5) * 0.3;
  const hp = Math.round(myPet.hp * (1 + offset));
  const attack = Math.round(myPet.attack * (1 + offset));
  const speed = Math.round(myPet.speed * (1 + offset));

  const names = ['暗影猫', '风暴鹰', '熔岩熊', '冰霜蛇', '雷电鼠', '幽灵狼', '翡翠龟', '烈焰马'];
  const name = names[Math.floor(Math.random() * names.length)];

  return {
    uid: 'opponent_001',
    templateId: 'opponent',
    name,
    rarity: myPet.rarity,
    hp,
    attack,
    speed,
    power: calculatePower(hp, attack, speed),
    slotIndex: -1,
  };
}
