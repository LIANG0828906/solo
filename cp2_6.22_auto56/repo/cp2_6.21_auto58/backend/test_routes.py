import sys
sys.path.insert(0, '.')

from main import app

print("Registered routes:")
for route in app.routes:
    if hasattr(route, 'path') and hasattr(route, 'methods'):
        print(f"  {route.methods} {route.path}")

print("\nTesting route count:", len(app.routes))
