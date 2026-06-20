import json

with open('src/data/starCatalog.json', 'r', encoding='utf-8') as f:
    stars = json.load(f)
schema = stars[0]
star_list = stars[1:]
print('=== starCatalog.json ===')
print('Schema字段:', list(schema['_$schema']['fields'].keys()))
print('恒星记录数:', len(star_list), '(需要200)')
required_fields = ['id', 'name', 'nameEn', 'constellationId', 'constellation', 'ra', 'dec', 'magnitude', 'spectralType', 'distance']
all_ok = all(all(f in s for f in required_fields) for s in star_list)
print('所有记录包含必需字段:', all_ok)
print('ID范围:', star_list[0]['id'], '-', star_list[-1]['id'])
unique_ids = len(set(s['id'] for s in star_list))
print('唯一ID数:', unique_ids)
unique_names = len(set(s['nameEn'] for s in star_list))
print('唯一英文名数:', unique_names)

print()

with open('src/data/constellation.json', 'r', encoding='utf-8') as f:
    consts = json.load(f)
print('=== constellation.json ===')
print('星座数量:', len(consts), '(需要30)')
req_fields = ['id', 'name', 'nameEn', 'bestSeason', 'areaRank', 'mainStars', 'lines', 'lineVertices']
all_ok2 = all(all(f in c for f in req_fields) for c in consts)
print('所有星座包含必需字段:', all_ok2)
has_season = all('season' in c for c in consts)
print('保留原season字段:', has_season)
main_stars_ok = all(isinstance(c['mainStars'], list) and all('name' in s and 'nameEn' in s for s in c['mainStars']) for c in consts)
print('mainStars格式正确(中英文名):', main_stars_ok)
line_vertices_ok = all(isinstance(c['lineVertices'], list) and len(c['lineVertices']) > 0 for c in consts)
print('lineVertices存在且非空:', line_vertices_ok)
print('第一个星座lineVertices示例:', consts[0]['lineVertices'][:2])

print()

with open('src/data/planetOrbit.json', 'r', encoding='utf-8') as f:
    planets = json.load(f)
print('=== planetOrbit.json ===')
print('行星数量:', len(planets), '(需要8)')
req_p_fields = ['id', 'name', 'nameEn', 'initialAngle', 'inclination']
all_ok3 = all(all(f in p for f in req_p_fields) for p in planets)
print('所有行星包含必需字段:', all_ok3)
angles_ok = all(0 <= p['initialAngle'] <= 360 for p in planets)
print('initialAngle在0-360度范围:', angles_ok)
for p in planets:
    print('  ' + p['name'] + ': initialAngle=' + str(p['initialAngle']) + ', inclination=' + str(p['inclination']))

print()
print('所有验证完成！')
