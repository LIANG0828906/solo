import sys
sys.path.insert(0, 'backend')
from core.chest_logic import open_chest, OPEN_METHOD_EFFECTS, CHEST_CONFIGS
import random

# 测试1: 验证 element_infusion 配置
print('=== 测试1: element_infusion 配置 ===')
ei_config = OPEN_METHOD_EFFECTS['element_infusion']
print("success_rate_boost:", ei_config['success_rate_boost'], "(期望: 0.0)")
print("element_fail_extra_penalty:", ei_config.get('element_fail_extra_penalty'), "(期望: 2.0)")
print("element_trap_extra_chance:", ei_config.get('element_trap_extra_chance'), "(期望: 15.0)")
assert ei_config['success_rate_boost'] == 0.0, 'success_rate_boost 应该是 0.0'
assert ei_config.get('element_fail_extra_penalty') == 2.0, 'element_fail_extra_penalty 应该是 2.0'
assert ei_config.get('element_trap_extra_chance') == 15.0, 'element_trap_extra_chance 应该是 15.0'
print('配置测试通过 ✓')

# 测试2: 多次调用元素注入，验证反噬逻辑
print()
print('=== 测试2: 多次运行 element_infusion 开箱 ===')
backlash_count = 0
for i in range(100):
    random.seed(i * 100)
    result = open_chest('iron_rune', 'element_infusion', [])
    if 'element_backlash_damage' in result['damage_breakdown']:
        backlash_count += 1
        dmg = result['damage_breakdown']['element_backlash_damage']
        assert '元素能量失控' in result['message'], '消息应包含元素反噬说明, 实际: ' + result['message']
        if backlash_count <= 3:
            print('  第' + str(i) + '次触发反噬: damage_breakdown=' + str(result['damage_breakdown']))
            print('    message=' + result['message'][:80])

print('100次测试中触发反噬次数:', backlash_count, '(约15%概率)')
print('逻辑测试通过 ✓')

# 测试3: 验证成功率不再是 -5%
print()
print('=== 测试3: 验证 element_infusion 成功率 ===')
from core.chest_logic import _calculate_success_rate
random.seed(99)
rate_ei = _calculate_success_rate('iron_rune', 'element_infusion', {})
rate_mr = _calculate_success_rate('iron_rune', 'magic_resonance', {})
rate_mp = _calculate_success_rate('iron_rune', 'mechanical_pick', {})
print("铁符文宝箱基础成功率:", CHEST_CONFIGS['iron_rune']['base_success_rate'])
print("  元素注入成功率:", rate_ei, "(应等于基础成功率，不再有 -5% 惩罚)")
print("  魔法共鸣成功率:", rate_mr, "(基础 +15%)")
print("  机械撬锁成功率:", rate_mp, "(基础 +5%)")
assert rate_ei == CHEST_CONFIGS['iron_rune']['base_success_rate'], 'element_infusion 成功率不应降低'
print('成功率测试通过 ✓')

print()
print('所有测试通过！修改完成。')
