from app.main import app

print(f"FastAPI应用加载成功")
print(f"总路由数: {len(app.routes)}")

routes = []
for r in app.routes:
    if hasattr(r, "methods"):
        methods = list(r.methods) if r.methods else ["ANY"]
        routes.append((r.path, methods[0]))

for p, m in sorted(routes):
    print(f"  {m:7s} {p}")
