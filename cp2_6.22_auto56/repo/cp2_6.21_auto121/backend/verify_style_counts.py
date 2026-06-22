import data

soft_cats = {"窗帘", "抱枕", "花瓶", "地毯", "灯具", "装饰画", "花架"}
styles = {}
for f in data.furniture_data:
    for t in f.style_tags:
        if t not in styles:
            styles[t] = {"furniture": 0, "soft": 0, "soft_items": [], "furn_items": []}
        if f.category in soft_cats:
            styles[t]["soft"] += 1
            styles[t]["soft_items"].append(f"{f.id}:{f.name}")
        else:
            styles[t]["furniture"] += 1
            styles[t]["furn_items"].append(f"{f.id}:{f.name}")

for s, c in sorted(styles.items()):
    furn_ok = "OK" if c["furniture"] >= 5 else "FAIL"
    soft_ok = "OK" if c["soft"] >= 5 else "FAIL"
    print(f"{s}: furniture={c['furniture']}({furn_ok}), soft={c['soft']}({soft_ok})")
    print(f"  Furniture: {c['furn_items']}")
    print(f"  Soft decor: {c['soft_items']}")
