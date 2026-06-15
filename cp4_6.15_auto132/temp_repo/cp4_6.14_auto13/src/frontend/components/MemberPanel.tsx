import { useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Plus, ChevronDown, Trash2, User } from 'lucide-react';
import type { Member } from '../types';
import { useAppStore } from '../store';

const RESTRICTION_OPTIONS = ['不吃辣', '素食', '坚果过敏', '海鲜过敏', '不吃香菜', '乳糖不耐受', '不吃牛肉', '不吃猪肉'];
const CUISINE_OPTIONS = ['中餐', '西餐', '日料', '韩餐', '东南亚'];
const DAYS = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
const MEALS = ['早餐', '午餐', '晚餐'];

const fade = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const Panel = styled.div`
  display: grid;
  grid-template-columns: 380px 1fr;
  gap: 24px;
  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

const Card = styled.div`
  background: #ffffff;
  border-radius: 12px;
  padding: 24px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 200ms ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const Title = styled.h3`
  margin-bottom: 16px;
  font-size: 18px;
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Label = styled.label`
  display: block;
  font-size: 14px;
  font-weight: 600;
  color: #5c3a1e;
  margin: 12px 0 6px;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1.5px solid #e8d8b8;
  background: #fffdf5;
  font-size: 14px;
  transition: border-color 150ms;
  &:focus {
    outline: none;
    border-color: #f4a460;
  }
`;

const ChipGroup = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
`;

const Chip = styled.button<{ $active: boolean }>`
  padding: 6px 14px;
  border-radius: 20px;
  font-size: 13px;
  background: ${(p) => (p.$active ? '#f4a460' : '#f3e9d2')};
  color: ${(p) => (p.$active ? '#fff8e7' : '#5c3a1e')};
  transition: all 200ms ease;
  &:hover {
    transform: translateY(-1px);
  }
`;

const Btn = styled.button<{ $primary?: boolean; $danger?: boolean }>`
  padding: 10px 20px;
  border-radius: 12px;
  font-size: 14px;
  font-weight: 600;
  background: ${(p) => (p.$primary ? '#f4a460' : p.$danger ? '#e57373' : '#f3e9d2')};
  color: ${(p) => (p.$primary || p.$danger ? '#fff8e7' : '#5c3a1e')};
  transition: all 200ms ease;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const MemberList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const MemberCardWrap = styled.div<{ $expanded: boolean }>`
  background: #ffffff;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 200ms ease;
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
`;

const MemberHeader = styled.div<{ $expanded: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  cursor: pointer;
  transition: background 150ms;
  &:hover {
    background: #fffaf0;
  }
  .chevron {
    transition: transform 300ms ease;
    transform: ${(p) => (p.$expanded ? 'rotate(180deg)' : 'rotate(0deg)')};
  }
`;

const MemberName = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-weight: 600;
  color: #5c3a1e;
  font-size: 15px;
`;

const ExpandArea = styled.div<{ $expanded: boolean }>`
  max-height: ${(p) => (p.$expanded ? '1000px' : '0px')};
  overflow: hidden;
  transition: max-height 400ms ease;
  border-top: ${(p) => (p.$expanded ? '1px solid #f3e9d2' : 'none')};
`;

const ExpandInner = styled.div`
  padding: 18px;
  animation: ${fade} 300ms ease;
`;

const Calendar = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  gap: 6px;
  margin-top: 8px;
`;

const CalendarHeader = styled.div`
  display: grid;
  grid-template-columns: 40px repeat(7, 1fr);
  gap: 6px;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 600;
  color: #8b6a45;
  text-align: center;
  .label {
    text-align: left;
    padding-left: 4px;
    display: flex;
    align-items: center;
  }
`;

const CalendarRow = styled.div`
  display: grid;
  grid-template-columns: 40px repeat(7, 1fr);
  gap: 6px;
  align-items: center;
  font-size: 12px;
  color: #8b6a45;
  .meal-label {
    font-weight: 500;
  }
`;

const AvailCell = styled.button<{ $avail: boolean }>`
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  background: ${(p) => (p.$avail ? '#f4a460' : '#e0d5c5')};
  color: ${(p) => (p.$avail ? '#fff8e7' : '#8b6a45')};
  transition: all 200ms ease;
  font-size: 13px;
  font-weight: 600;
  animation: ${fade} 200ms ease;
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.12);
  }
`;

export default function MemberPanel() {
  const { members, addMember, updateMember, deleteMember } = useAppStore();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [restrictions, setRestrictions] = useState<string[]>([]);
  const [cuisinePrefs, setCuisinePrefs] = useState<string[]>([]);

  const toggleRestriction = (r: string) => {
    setRestrictions((prev) => {
      if (prev.includes(r)) return prev.filter((x) => x !== r);
      if (prev.length >= 5) return prev;
      return [...prev, r];
    });
  };

  const toggleCuisine = (c: string) => {
    setCuisinePrefs((prev) => {
      if (prev.includes(c)) return prev.filter((x) => x !== c);
      if (prev.length >= 3) return prev;
      return [...prev, c];
    });
  };

  const handleAdd = async () => {
    if (!name.trim()) return;
    const availability = Array.from({ length: 7 }, () => [true, true, true]);
    await addMember({ name, restrictions, cuisinePrefs, availability });
    setName('');
    setRestrictions([]);
    setCuisinePrefs([]);
  };

  const toggleEditRestriction = (m: Member, r: string) => {
    const newList = m.restrictions.includes(r)
      ? m.restrictions.filter((x) => x !== r)
      : m.restrictions.length >= 5
      ? m.restrictions
      : [...m.restrictions, r];
    updateMember(m.id, { restrictions: newList });
  };

  const toggleEditCuisine = (m: Member, c: string) => {
    const newList = m.cuisinePrefs.includes(c)
      ? m.cuisinePrefs.filter((x) => x !== c)
      : m.cuisinePrefs.length >= 3
      ? m.cuisinePrefs
      : [...m.cuisinePrefs, c];
    updateMember(m.id, { cuisinePrefs: newList });
  };

  const toggleAvailability = (m: Member, day: number, meal: number) => {
    const newAvail = m.availability.map((row) => [...row]);
    newAvail[day][meal] = !newAvail[day][meal];
    updateMember(m.id, { availability: newAvail });
  };

  return (
    <Panel>
      <Card>
        <Title><Plus size={18} /> 添加新成员</Title>
        <Label>成员姓名</Label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例如：爸爸"
        />
        <Label>忌口（最多5项）</Label>
        <ChipGroup>
          {RESTRICTION_OPTIONS.map((r) => (
            <Chip
              key={r}
              $active={restrictions.includes(r)}
              onClick={() => toggleRestriction(r)}
            >
              {r}
            </Chip>
          ))}
        </ChipGroup>
        <Label>偏好菜系（最多3项）</Label>
        <ChipGroup>
          {CUISINE_OPTIONS.map((c) => (
            <Chip
              key={c}
              $active={cuisinePrefs.includes(c)}
              onClick={() => toggleCuisine(c)}
            >
              {c}
            </Chip>
          ))}
        </ChipGroup>
        <div style={{ marginTop: 20 }}>
          <Btn $primary onClick={handleAdd}>
            <Plus size={16} /> 添加成员
          </Btn>
        </div>
      </Card>

      <div>
        <Title>家庭成员（{members.length}）</Title>
        <MemberList>
          {members.length === 0 && (
            <Card style={{ textAlign: 'center', color: '#8b6a45' }}>
              暂无成员，请先添加家庭成员
            </Card>
          )}
          {members.map((m) => {
            const expanded = expandedId === m.id;
            return (
              <MemberCardWrap key={m.id} $expanded={expanded}>
                <MemberHeader
                  $expanded={expanded}
                  onClick={() => setExpandedId(expanded ? null : m.id)}
                >
                  <MemberName>
                    <User size={18} />
                    {m.name}
                    <span style={{ fontSize: 12, color: '#8b6a45', fontWeight: 400 }}>
                      {m.cuisinePrefs.length > 0 ? ` · ${m.cuisinePrefs.join('/')}` : ''}
                      {m.restrictions.length > 0 ? ` · ${m.restrictions.length}项忌口` : ''}
                    </span>
                  </MemberName>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Btn
                      $danger
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMember(m.id);
                      }}
                    >
                      <Trash2 size={14} />
                    </Btn>
                    <ChevronDown size={18} className="chevron" />
                  </div>
                </MemberHeader>
                <ExpandArea $expanded={expanded}>
                  <ExpandInner>
                    <Label>忌口设置（最多5项）</Label>
                    <ChipGroup>
                      {RESTRICTION_OPTIONS.map((r) => (
                        <Chip
                          key={r}
                          $active={m.restrictions.includes(r)}
                          onClick={() => toggleEditRestriction(m, r)}
                        >
                          {r}
                        </Chip>
                      ))}
                    </ChipGroup>
                    <Label>偏好菜系（最多3项）</Label>
                    <ChipGroup>
                      {CUISINE_OPTIONS.map((c) => (
                        <Chip
                          key={c}
                          $active={m.cuisinePrefs.includes(c)}
                          onClick={() => toggleEditCuisine(m, c)}
                        >
                          {c}
                        </Chip>
                      ))}
                    </ChipGroup>
                    <Label>每周可用餐时段（点击切换）</Label>
                    <CalendarHeader>
                      <div className="label">餐段</div>
                      {DAYS.map((d) => (
                        <div key={d}>{d}</div>
                      ))}
                    </CalendarHeader>
                    {MEALS.map((meal, mi) => (
                      <CalendarRow key={meal}>
                        <div className="meal-label">{meal}</div>
                        {DAYS.map((_, di) => (
                          <AvailCell
                            key={di}
                            $avail={!!m.availability[di]?.[mi]}
                            onClick={() => toggleAvailability(m, di, mi)}
                          >
                            {m.availability[di]?.[mi] ? '✓' : '✕'}
                          </AvailCell>
                        ))}
                      </CalendarRow>
                    ))}
                  </ExpandInner>
                </ExpandArea>
              </MemberCardWrap>
            );
          })}
        </MemberList>
      </div>
    </Panel>
  );
}
