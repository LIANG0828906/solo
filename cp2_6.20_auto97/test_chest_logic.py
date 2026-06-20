import sys
sys.path.insert(0, 'backend')
from core.chest_logic import (
    CHEST_CONFIGS,
    OPEN_METHOD_EFFECTS,
    TRAP_TYPES,
    _calculate_success_rate,
    _calculate_trap_chance,
    _calculate_trap_damage,
    _calculate_fail_penalty,
    open_chest,
)

print('=' * 60)
print('宝箱基础配置验证')
print('=' * 60)
for chest_id, config in CHEST_CONFIGS.items():
    print(chest_id + ':')
    print('  基础成功率: ' + str(config['base_success_rate']) + '%')
    print('  基础陷阱率: ' + str(config['base_trap_chance']) + '%')
    print('  伤害范围: ' + str(config['trap_damage_range']))
    print('  碎片范围: ' + str(config['fragment_drop_range']))
    print()

print('=' * 60)
print('开箱方式效果验证')
print('=' * 60)
for method_id, effects in OPEN_METHOD_EFFECTS.items():
    print(method_id + ' (' + effects['name'] + '):')
    print('  成功率加成: ' + ('%+g' % effects['success_rate_boost']) + '%')
    print('  陷阱概率修正: ' + ('%+g' % effects['trap_chance_modifier']) + '%')
    print('  陷阱伤害系数: ' + str(effects['trap_damage_multiplier']) + 'x')
    print('  稀有掉落修正: ' + ('%+g' % effects['rare_drop_modifier']) + '%')
    print('  碎片系数: ' + str(effects['fragment_multiplier']) + 'x')
    print('  失败惩罚系数: ' + str(effects['fail_penalty_multiplier']) + 'x')
    print()

print('=' * 60)
print('成功率计算验证（无铭文加成）')
print('=' * 60)
bonuses = {'success_boost': 0, 'luck_boost': 0, 'trap_reduction': 0, 'rare_chance': 0, 'fragment_bonus': 0}
for chest in ['iron_rune', 'crystal_seal', 'shadow_curse']:
    for method in ['magic_resonance', 'mechanical_pick', 'element_infusion']:
        success_rate = _calculate_success_rate(chest, method, bonuses)
        trap_chance = _calculate_trap_chance(chest, method, bonuses)
        fail_penalty = _calculate_fail_penalty(chest, method)
        print(chest + ' + ' + method + ':')
        print('  成功率: %.1f%%' % success_rate)
        print('  陷阱率: %.1f%%' % trap_chance)
        print('  失败基础惩罚: ' + str(fail_penalty))
    print()

print('=' * 60)
print('实际开箱测试（执行10次铁符文宝箱+魔法共鸣）')
print('=' * 60)
for i in range(10):
    result = open_chest('iron_rune', 'magic_resonance', [])
    frag_count = sum(f['amount'] for f in result['fragments'])
    print('第%d次: 成功=%s, 伤害=%d, 物品数=%d, 碎片数=%d' % 
          (i+1, result['success'], result['damage'], len(result['items']), frag_count))
    if result['trap_info']:
        print('  陷阱: ' + result['trap_info']['name'])
    if result['damage_breakdown']:
        print('  伤害明细: ' + str(result['damage_breakdown']))

print()
print('=' * 60)
print('陷阱类型验证')
print('=' * 60)
for trap in TRAP_TYPES:
    print(trap['id'] + ' (' + trap['name'] + '): 伤害系数=' + 
          str(trap['damage_multiplier']) + 'x, 效果=' + trap['special_effect'])

print()
print('=' * 60)
print('暗影诅咒+元素注入测试（高风险高回报）')
print('=' * 60)
for i in range(5):
    result = open_chest('shadow_curse', 'element_infusion', [])
    frag_count = sum(f['amount'] for f in result['fragments'])
    rarities = [item['rarity'] for item in result['items']]
    print('第%d次: 成功=%s, 伤害=%d, 物品=%s, 碎片=%d' % 
          (i+1, result['success'], result['damage'], str(rarities), frag_count))
    if result['trap_info']:
        print('  陷阱: ' + result['trap_info']['name'])

print()
print('=' * 60)
print('算法验证完成！')
print('=' * 60)
