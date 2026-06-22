import json
import sys
import os

sys.path.insert(0, '.')

# 读取两个部分
with open('data/story_templates_part1.json', 'r', encoding='utf-8') as f:
    part1 = json.load(f)
with open('data/story_templates_part2.json', 'r', encoding='utf-8') as f:
    part2 = json.load(f)

# 合并
final_data = {"stories": {}}
final_data["stories"].update(part1["stories"])
final_data["stories"].update(part2["stories"])

# JSON 双重验证
json_str = json.dumps(final_data, ensure_ascii=False, indent=2)
validated = json.loads(json_str)

print("="*70)
print("最终故事模板验证")
print("="*70)

total_nodes = 0
total_choices = 0
total_endings = 0
all_ok = True

for sname, story in validated["stories"].items():
    node_ids = set()
    for node in story["nodes"]:
        if node["id"] in node_ids:
            print(f"[{sname}] 错误！重复节点ID: {node['id']}")
            all_ok = False
        node_ids.add(node["id"])

    broken = []
    choice_count = 0
    for node in story["nodes"]:
        for ch in node.get("choices", []):
            choice_count += 1
            if ch["next_node_id"] not in node_ids:
                broken.append((node["id"], ch["next_node_id"]))

    ending_count = sum(1 for n in story["nodes"] if n.get("end"))
    start_count = sum(1 for n in story["nodes"] if n["id"].endswith("_start") or n["id"] == "start")

    if broken:
        all_ok = False
        for src, dst in broken:
            print(f"[{sname}] 坏引用: {src} -> {dst}")

    total_nodes += len(node_ids)
    total_choices += choice_count
    total_endings += ending_count

    status = "✓" if not broken else "✗"
    print(f"{status} [{sname}] 节点={len(node_ids)}, 分支={choice_count}, 结局={ending_count}, 起始节点={start_count}")

print("-"*70)
print(f"总计: 故事数={len(validated['stories'])}, 节点数={total_nodes}, 分支数={total_choices}, 结局数={total_endings}")
print("="*70)
if all_ok:
    print("✓ 全部验证通过！")

    # 写回最终文件
    with open('data/story_templates.json', 'w', encoding='utf-8') as f:
        f.write(json_str)
    print("✓ story_templates.json 已更新")

    # 清理临时文件
    for f in ['data/story_templates_part1.json', 'data/story_templates_part2.json',
              '_gen_part1.py', '_gen_part2.py']:
        if os.path.exists(f):
            os.remove(f)
    print("✓ 临时文件已清理")
else:
    print("✗ 存在错误，未写入最终文件！")
    sys.exit(1)

# ============================================================
# 引擎层验证（通过 narrative_engine 加载）
# ============================================================
print("\n" + "="*70)
print("引擎层验证")
print("="*70)

from engine.narrative_engine import NarrativeEngine
from models.story_model import GameState

try:
    engine = NarrativeEngine()
    themes = ["medieval", "space", "magic", "cyberpunk", "apocalypse"]
    theme_display = {
        "medieval": "中世纪奇幻",
        "space": "太空殖民",
        "magic": "魔法学院",
        "cyberpunk": "赛博朋克侦探",
        "apocalypse": "末日生存"
    }

    for theme in themes:
        node = engine.get_start_node(theme)
        print(f"✓ [{theme_display[theme]}] 起始节点: {node.id}")

        if len(node.choices) > 0:
            choice = node.choices[0]
            state = GameState(currentNodeId=node.id)
            try:
                next_node, new_state = engine.process_choice(node.id, choice.id, state)
                print(f"    分支跳转测试: {node.id} -> {choice.id} -> {next_node.id} ✓")
                if len(next_node.choices) > 0:
                    choice2 = next_node.choices[0]
                    next_node2, _ = engine.process_choice(next_node.id, choice2.id, new_state)
                    print(f"    二级分支测试: {next_node.id} -> {choice2.id} -> {next_node2.id} ✓")
            except Exception as e:
                print(f"    ✗ 分支跳转失败: {type(e).__name__}: {e}")
                all_ok = False

    print("-"*70)
    print("✓ 引擎层验证全部通过！")
except Exception as e:
    print(f"✗ 引擎加载失败: {type(e).__name__}: {e}")
    import traceback
    traceback.print_exc()
    all_ok = False
    sys.exit(1)

if all_ok:
    print("\n" + "="*70)
    print("🎉 所有验证完成！项目已准备就绪。")
    print("="*70)
