import random
from typing import List, Dict, Tuple
from models import (
    Calculus, ElementRelation, CombineResponse,
    ArtifactAttributes, ElementType
)

GENERATION: Dict[ElementType, ElementType] = {
    'wood': 'fire',
    'fire': 'earth',
    'earth': 'metal',
    'metal': 'water',
    'water': 'wood',
}

OVERCOMING: Dict[ElementType, ElementType] = {
    'wood': 'earth',
    'earth': 'water',
    'water': 'fire',
    'fire': 'metal',
    'metal': 'wood',
}

ELEMENT_BASE_ATTRIBUTES: Dict[ElementType, Dict[str, int]] = {
    'wood': {'hardness': 40, 'sharpness': 30, 'resonance': 70, 'durability': 50, 'flexibility': 80},
    'fire': {'hardness': 30, 'sharpness': 90, 'resonance': 60, 'durability': 20, 'flexibility': 40},
    'earth': {'hardness': 70, 'sharpness': 20, 'resonance': 40, 'durability': 90, 'flexibility': 30},
    'metal': {'hardness': 90, 'sharpness': 85, 'resonance': 50, 'durability': 75, 'flexibility': 20},
    'water': {'hardness': 20, 'sharpness': 50, 'resonance': 80, 'durability': 40, 'flexibility': 90},
}

BONUS_EFFECTS: Dict[str, str] = {
    'wood-fire': '木火通明',
    'fire-earth': '火土相生',
    'earth-metal': '土生金气',
    'metal-water': '金水相涵',
    'water-wood': '水木清华',
    'wood-earth': '木克土虚',
    'earth-water': '土克水浊',
    'water-fire': '水克火熄',
    'fire-metal': '火克金熔',
    'metal-wood': '金克木伤',
}

ARTIFACT_NAMES = {
    'chariot': ['战车', '辚辚车', '雷霆车', '风火轮', '四象车', '八卦车'],
    'farm': ['耒耜', '锄犁', '耕耘器', '百谷铲', '神农锄', '万象犁'],
    'instrument': ['琴瑟', '笙箫', '鼓磬', '天籁', '凤鸣琴', '龙啸笛'],
    'weapon': ['宝剑', '利刃', '长矛', '破甲', '轩辕剑', '蚩尤刀'],
    'vessel': ['鼎彝', '尊壶', '聚宝盆', '乾坤瓶', '镇国鼎', '如意尊'],
    'unknown': ['玄器', '妙物', '天工造', '神机关', '混沌物', '太初器'],
}

NAME_PREFIXES = ['四象', '五行', '三才', '两仪', '太极', '七星', '八卦', '九宫', '六合', '九转']


def detect_relations(elements: List[ElementType]) -> List[ElementRelation]:
    relations: List[ElementRelation] = []
    unique_elements = list(set(elements))
    
    for i in range(len(unique_elements)):
        for j in range(len(unique_elements)):
            if i == j:
                continue
            from_el = unique_elements[i]
            to_el = unique_elements[j]
            
            if GENERATION.get(from_el) == to_el:
                relations.append(ElementRelation(
                    type='generates',
                    from_element=from_el,
                    to=to_el,
                    effect=10 + random.randint(0, 10)
                ))
            
            if OVERCOMING.get(from_el) == to_el:
                relations.append(ElementRelation(
                    type='overcomes',
                    from_element=from_el,
                    to=to_el,
                    effect=5 + random.randint(0, 10)
                ))
    
    return relations


def calculate_attributes(
    calculi: List[Calculus],
    relations: List[ElementRelation]
) -> ArtifactAttributes:
    solidity = 0.0
    sharpness = 0.0
    temperament = 0.0
    durability = 0.0
    flexibility = 0.0
    
    for c in calculi:
        attrs = c.attributes
        solidity += attrs.hardness * 0.5 + attrs.durability * 0.3
        sharpness += attrs.sharpness
        temperament += attrs.resonance
        durability += attrs.durability
        flexibility += attrs.flexibility
    
    for rel in relations:
        if rel.type == 'generates':
            solidity += rel.effect
            sharpness += rel.effect * 0.5
            durability += rel.effect * 0.3
    
    count = max(len(calculi), 1)
    balance = 100 - abs(flexibility - solidity / count) * 0.5
    
    return ArtifactAttributes(
        solidity=min(100, round(solidity / count)),
        sharpness=min(100, round(sharpness / count)),
        temperament=min(100, round(temperament / count)),
        durability=min(100, round(durability / count)),
        balance=min(100, max(0, round(balance)))
    )


def determine_artifact_type(
    element_counts: Dict[ElementType, int],
    attributes: ArtifactAttributes
) -> str:
    if not element_counts:
        return 'unknown'
    
    max_count = max(element_counts.values())
    dominant = [k for k, v in element_counts.items() if v == max_count][0]
    
    if dominant == 'metal' and attributes.sharpness > 60:
        return 'weapon'
    if dominant == 'wood' and attributes.solidity > 50:
        return 'chariot'
    if dominant == 'earth':
        return 'vessel'
    if dominant == 'water' or attributes.temperament > 60:
        return 'instrument'
    if dominant == 'fire' or attributes.sharpness > 70:
        return 'weapon'
    if attributes.balance > 70 and attributes.solidity > 50:
        return 'farm'
    return 'unknown'


def generate_artifact_name(artifact_type: str, elements: List[ElementType]) -> str:
    prefix = random.choice(NAME_PREFIXES)
    suffix_list = ARTIFACT_NAMES.get(artifact_type, ARTIFACT_NAMES['unknown'])
    suffix = random.choice(suffix_list)
    return f'{prefix}{suffix}'


def generate_bonus_effects(relations: List[ElementRelation]) -> List[str]:
    effects: List[str] = []
    for rel in relations:
        key = f'{rel.from_element}-{rel.to}'
        if key in BONUS_EFFECTS:
            effects.append(BONUS_EFFECTS[key])
    return effects


def combine_calculi(calculi: List[Calculus], grid_positions) -> CombineResponse:
    if not calculi:
        return CombineResponse(
            artifactType='unknown',
            artifactName='未成之物',
            attributes=ArtifactAttributes(
                solidity=0, sharpness=0, temperament=0, durability=0, balance=0
            ),
            relations=[],
            bonusEffects=[]
        )
    
    elements: List[ElementType] = [c.element for c in calculi]
    element_counts: Dict[ElementType, int] = {}
    for el in elements:
        element_counts[el] = element_counts.get(el, 0) + 1
    
    relations = detect_relations(elements)
    attributes = calculate_attributes(calculi, relations)
    artifact_type = determine_artifact_type(element_counts, attributes)
    artifact_name = generate_artifact_name(artifact_type, elements)
    bonus_effects = generate_bonus_effects(relations)
    
    return CombineResponse(
        artifactType=artifact_type,
        artifactName=artifact_name,
        attributes=attributes,
        relations=relations,
        bonusEffects=bonus_effects
    )
