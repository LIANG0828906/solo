import os
import json
import uuid
from datetime import timedelta
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
from PIL import Image

from database import init_db
from models import User, Recipe, RecipeStep, Favorite, Comment


app = Flask(__name__)

CORS(app, supports_credentials=True)

app.config['JWT_SECRET_KEY'] = 'cooking-journal-secret-key-2024-safe'
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)
jwt = JWTManager(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
COVERS_FOLDER = os.path.join(UPLOAD_FOLDER, 'covers')
STEPS_FOLDER = os.path.join(UPLOAD_FOLDER, 'steps')
os.makedirs(COVERS_FOLDER, exist_ok=True)
os.makedirs(STEPS_FOLDER, exist_ok=True)

app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024

ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif'}


def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def save_image(file, folder, convert_to_jpg=False):
    if not file or file.filename == '':
        return ''
    
    if not allowed_file(file.filename):
        raise ValueError('不支持的图片格式')
    
    ext = 'jpg' if convert_to_jpg else file.filename.rsplit('.', 1)[1].lower()
    filename = f"{uuid.uuid4().hex}.{ext}"
    filepath = os.path.join(folder, filename)
    
    if convert_to_jpg:
        img = Image.open(file)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        img.save(filepath, 'JPEG', quality=85)
    else:
        file.save(filepath)
    
    rel_path = os.path.relpath(filepath, os.path.dirname(__file__))
    return '/' + rel_path.replace('\\', '/')


def get_current_user_id():
    try:
        return get_jwt_identity()
    except Exception:
        return None


with app.app_context():
    init_db()


@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    
    if not data:
        return jsonify({'error': '请求参数不能为空'}), 400
    
    email = data.get('email', '').strip()
    password = data.get('password', '')
    username = data.get('username', '').strip()
    
    if not email or not password or not username:
        return jsonify({'error': '邮箱、密码和用户名不能为空'}), 400
    
    if len(password) < 6:
        return jsonify({'error': '密码长度不能少于6位'}), 400
    
    existing_user = User.get_by_email(email)
    if existing_user:
        return jsonify({'error': '该邮箱已被注册'}), 400
    
    try:
        user = User.create(email, password, username)
        token = create_access_token(identity=user.id)
        return jsonify({'token': token, 'user': user.to_dict()}), 201
    except Exception as e:
        return jsonify({'error': f'注册失败: {str(e)}'}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    
    if not data:
        return jsonify({'error': '请求参数不能为空'}), 400
    
    email = data.get('email', '').strip()
    password = data.get('password', '')
    
    if not email or not password:
        return jsonify({'error': '邮箱和密码不能为空'}), 400
    
    user = User.authenticate(email, password)
    if not user:
        return jsonify({'error': '邮箱或密码错误'}), 401
    
    token = create_access_token(identity=user.id)
    return jsonify({'token': token, 'user': user.to_dict()}), 200


@app.route('/api/recipes', methods=['GET'])
def get_recipes():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    tag = request.args.get('tag', None)
    
    current_user_id = get_current_user_id()
    
    recipes, total = Recipe.get_list(page=page, per_page=per_page, tag=tag)
    
    data = [recipe.to_dict(current_user_id) for recipe in recipes]
    return jsonify({'data': data, 'total': total}), 200


@app.route('/api/recipes', methods=['POST'])
@jwt_required()
def create_recipe():
    current_user_id = get_jwt_identity()
    
    try:
        title = request.form.get('title', '').strip()
        cover_image_file = request.files.get('cover_image')
        tags_str = request.form.get('tags', '[]')
        steps_str = request.form.get('steps', '[]')
        
        if not title:
            return jsonify({'error': '食谱标题不能为空'}), 400
        
        if not cover_image_file:
            return jsonify({'error': '请上传封面图片'}), 400
        
        tags = json.loads(tags_str)
        steps_data = json.loads(steps_str)
        
        if not isinstance(tags, list):
            return jsonify({'error': 'tags 必须是数组'}), 400
        
        if not isinstance(steps_data, list) or len(steps_data) == 0:
            return jsonify({'error': '至少需要一个步骤'}), 400
        
        cover_image_url = save_image(cover_image_file, COVERS_FOLDER, convert_to_jpg=True)
        
        steps = []
        for index, step_data in enumerate(steps_data):
            description = step_data.get('description', '').strip()
            if not description:
                return jsonify({'error': f'第 {index + 1} 步的描述不能为空'}), 400
            
            step_image_file = request.files.get(f'steps[{index}][image]')
            step_image_url = ''
            if step_image_file:
                step_image_url = save_image(step_image_file, STEPS_FOLDER, convert_to_jpg=False)
            
            steps.append({
                'order': index + 1,
                'description': description,
                'image': step_image_url
            })
        
        recipe = Recipe.create(title, cover_image_url, tags, current_user_id, steps)
        return jsonify(recipe.to_dict(current_user_id)), 201
        
    except json.JSONDecodeError:
        return jsonify({'error': 'JSON 格式错误'}), 400
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        return jsonify({'error': f'创建食谱失败: {str(e)}'}), 500


@app.route('/api/recipes/<int:recipe_id>', methods=['GET'])
def get_recipe_detail(recipe_id):
    current_user_id = get_current_user_id()
    
    recipe = Recipe.get_by_id(recipe_id)
    if not recipe:
        return jsonify({'error': '食谱不存在'}), 404
    
    return jsonify(recipe.to_dict(current_user_id)), 200


@app.route('/api/recipes/<int:recipe_id>/favorite', methods=['POST'])
@jwt_required()
def toggle_favorite(recipe_id):
    current_user_id = get_jwt_identity()
    
    recipe = Recipe.get_by_id(recipe_id)
    if not recipe:
        return jsonify({'error': '食谱不存在'}), 404
    
    try:
        success, is_favorited = Favorite.toggle(current_user_id, recipe_id)
        return jsonify({'success': success, 'is_favorited': is_favorited}), 200
    except Exception as e:
        return jsonify({'error': f'操作失败: {str(e)}'}), 500


@app.route('/api/recipes/recommendations', methods=['GET'])
def get_recommendations():
    current_user_id = get_current_user_id()
    
    if current_user_id:
        recipes = Recipe.get_recommendations(current_user_id, limit=8)
    else:
        recipes, _ = Recipe.get_list(page=1, per_page=8)
    
    data = [recipe.to_dict(current_user_id) for recipe in recipes]
    return jsonify({'data': data}), 200


@app.route('/api/recipes/<int:recipe_id>/comments', methods=['GET'])
def get_comments(recipe_id):
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    
    recipe = Recipe.get_by_id(recipe_id)
    if not recipe:
        return jsonify({'error': '食谱不存在'}), 404
    
    comments, total = Comment.get_by_recipe_id(recipe_id, page, per_page)
    
    data = [comment.to_dict() for comment in comments]
    return jsonify({'data': data, 'total': total}), 200


@app.route('/api/recipes/<int:recipe_id>/comments', methods=['POST'])
@jwt_required()
def create_comment(recipe_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data:
        return jsonify({'error': '请求参数不能为空'}), 400
    
    content = data.get('content', '').strip()
    if not content:
        return jsonify({'error': '评论内容不能为空'}), 400
    
    recipe = Recipe.get_by_id(recipe_id)
    if not recipe:
        return jsonify({'error': '食谱不存在'}), 404
    
    try:
        comment = Comment.create(current_user_id, recipe_id, content)
        return jsonify(comment.to_dict()), 201
    except Exception as e:
        return jsonify({'error': f'评论失败: {str(e)}'}), 500


@app.route('/api/users/<int:user_id>', methods=['GET'])
def get_user_info(user_id):
    user = User.get_by_id(user_id)
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    
    return jsonify(user.to_dict()), 200


@app.route('/api/users/<int:user_id>/recipes', methods=['GET'])
def get_user_recipes(user_id):
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    
    user = User.get_by_id(user_id)
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    
    current_user_id = get_current_user_id()
    
    recipes, total = Recipe.get_list(page=page, per_page=per_page, user_id=user_id)
    
    data = [recipe.to_dict(current_user_id) for recipe in recipes]
    return jsonify({'data': data, 'total': total}), 200


@app.route('/api/users/<int:user_id>/favorites', methods=['GET'])
def get_user_favorites(user_id):
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 20))
    
    user = User.get_by_id(user_id)
    if not user:
        return jsonify({'error': '用户不存在'}), 404
    
    current_user_id = get_current_user_id()
    
    recipes, total = Favorite.get_user_favorites(user_id, page, per_page)
    
    data = [recipe.to_dict(current_user_id) for recipe in recipes]
    return jsonify({'data': data, 'total': total}), 200


@app.route('/uploads/<path:filename>')
def serve_uploads(filename):
    return send_from_directory(app.config['UPLOAD_FOLDER'], filename)


@app.errorhandler(404)
def not_found(e):
    return jsonify({'error': '接口不存在'}), 404


@app.errorhandler(413)
def too_large(e):
    return jsonify({'error': '文件大小超过限制（最大5MB）'}), 413


@app.errorhandler(500)
def server_error(e):
    return jsonify({'error': '服务器内部错误'}), 500


if __name__ == '__main__':
    app.run(debug=True, port=5000, host='0.0.0.0')
