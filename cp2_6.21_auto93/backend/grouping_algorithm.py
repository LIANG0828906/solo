import random
from typing import List, Dict, Any


def balanced_grouping(participants: List[Dict[str, Any]], group_count: int) -> List[List[Dict[str, Any]]]:
    """
    贪心平衡分组算法
    
    原理：
    1. 为每个参与者随机分配一个技能值 (1-100)
    2. 按技能值从高到低排序
    3. 轮流将参与者分配到当前总技能值最低的组
    
    Args:
        participants: 参与者列表，每个元素为包含参与者信息的字典
        group_count: 分组数量
    
    Returns:
        分组后的二维列表，每个子列表代表一个组
    """
    if group_count <= 0:
        raise ValueError("分组数量必须大于0")
    
    if not participants:
        return [[] for _ in range(group_count)]
    
    participants_with_skill = []
    for p in participants:
        skill = random.randint(1, 100)
        participant_copy = dict(p)
        participant_copy["skill"] = skill
        participants_with_skill.append(participant_copy)
    
    participants_with_skill.sort(key=lambda x: x["skill"], reverse=True)
    
    groups = [[] for _ in range(group_count)]
    group_skill_sums = [0] * group_count
    
    for participant in participants_with_skill:
        min_skill_index = group_skill_sums.index(min(group_skill_sums))
        groups[min_skill_index].append(participant)
        group_skill_sums[min_skill_index] += participant["skill"]
    
    return groups


def random_grouping(participants: List[Dict[str, Any]], group_count: int) -> List[List[Dict[str, Any]]]:
    """
    随机分组算法
    
    原理：
    1. 使用 random.shuffle 打乱参与者顺序
    2. 按顺序依次分配到各个组
    
    Args:
        participants: 参与者列表，每个元素为包含参与者信息的字典
        group_count: 分组数量
    
    Returns:
        分组后的二维列表，每个子列表代表一个组
    """
    if group_count <= 0:
        raise ValueError("分组数量必须大于0")
    
    if not participants:
        return [[] for _ in range(group_count)]
    
    shuffled = list(participants)
    random.shuffle(shuffled)
    
    groups = [[] for _ in range(group_count)]
    for i, participant in enumerate(shuffled):
        group_index = i % group_count
        groups[group_index].append(participant)
    
    return groups
