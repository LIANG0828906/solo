from main import app
print('FastAPI app 导入成功')
print(f'路由数: {len(app.routes)}')
for route in app.routes:
    if hasattr(route, 'path') and hasattr(route, 'methods'):
        print(f'  {route.methods} {route.path}')
