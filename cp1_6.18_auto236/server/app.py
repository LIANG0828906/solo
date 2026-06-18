from flask import Flask, request, jsonify
from flask_cors import CORS
from recipeEngine import get_recipe_recommendations, get_all_recipes
import time

app = Flask(__name__)
CORS(app)

@app.route('/api/guess', methods=['POST'])
def guess_recipes():
    start_time = time.time()
    
    data = request.get_json()
    if not data or 'ingredients' not in data:
        return jsonify({'error': '缺少 ingredients 参数'}), 400
    
    ingredients = data['ingredients']
    if not isinstance(ingredients, list):
        return jsonify({'error': 'ingredients 必须是列表'}), 400
    
    recipes = get_recipe_recommendations(ingredients)
    
    elapsed = time.time() - start_time
    print(f"推荐计算耗时: {elapsed*1000:.2f}ms")
    
    return jsonify({
        'recipes': recipes,
        'total': len(recipes)
    })

@app.route('/api/recipes', methods=['GET'])
def get_recipes():
    recipes = get_all_recipes()
    return jsonify({
        'recipes': recipes,
        'total': len(recipes)
    })

@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'ok', 'message': '配方魔方服务运行中'})

if __name__ == '__main__':
    print('🍳 配方魔方后端服务启动中...')
    print('📍 服务地址: http://localhost:5000')
    app.run(host='0.0.0.0', port=5000, debug=True)
