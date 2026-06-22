from flask import Flask, request, jsonify
from flask_cors import CORS
from models import Requirement, Order, FosterFamily
import random
from datetime import datetime, timedelta

app = Flask(__name__)
CORS(app)

requirements_db: dict[str, Requirement] = {}
orders_db: dict[str, Order] = {}
fosters_db: dict[str, FosterFamily] = {}


def generate_sample_data():
    pet_avatars = [
        "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400",
        "https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=400",
        "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=400",
        "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=400",
        "https://images.unsplash.com/photo-1596492784531-6e6eb5ea9993?w=400",
    ]
    foster_avatars = [
        "https://api.dicebear.com/7.x/avataaars/svg?seed=foster1",
        "https://api.dicebear.com/7.x/avataaars/svg?seed=foster2",
        "https://api.dicebear.com/7.x/avataaars/svg?seed=foster3",
    ]
    env_photos = [
        "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=600",
        "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=600",
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600",
    ]

    for i in range(3):
        foster = FosterFamily.create(
            name=f"寄养家庭{i+1}",
            avatar=foster_avatars[i],
            environment_photos=env_photos,
            max_pet_size=random.choice(["小型", "中型", "大型"]),
            daily_fee=random.uniform(80, 200),
            rating=round(random.uniform(4.0, 5.0), 1),
            bio="热爱小动物，有多年养宠经验，家里有独立的宠物活动空间。"
        )
        fosters_db[foster.id] = foster

    pet_breeds = ["金毛", "柯基", "布偶猫", "泰迪", "比熊", "哈士奇", "英短", "拉布拉多"]
    personalities = [["粘人", "活泼"], ["胆小", "安静"], ["护食", "独立"], ["亲人", "爱玩"]]
    names = ["豆豆", "毛毛", "小白", "旺财", "咪咪", "花花", "小黑", "球球"]

    for i in range(25):
        start = datetime.now() + timedelta(days=random.randint(1, 30))
        end = start + timedelta(days=random.randint(2, 14))
        req = Requirement.create(
            pet_name=names[i % len(names)],
            pet_breed=pet_breeds[i % len(pet_breeds)],
            pet_age=random.randint(1, 10),
            pet_personality=personalities[i % len(personalities)],
            pet_avatar=pet_avatars[i % len(pet_avatars)],
            start_date=start.isoformat(),
            end_date=end.isoformat(),
            daily_budget=round(random.uniform(50, 300), 2),
            owner_id=f"owner_{i}",
            owner_name=f"宠物主人{i+1}"
        )

        for j in range(random.randint(1, 3)):
            foster_list = list(fosters_db.values())
            foster = foster_list[j % len(foster_list)]
            req.add_application(
                foster_id=foster.id,
                foster_name=foster.name,
                foster_rating=foster.rating,
                foster_intro=foster.bio,
                foster_avatar=foster.avatar
            )
        requirements_db[req.id] = req

    for i, req in enumerate(list(requirements_db.values())[:5]):
        if req.applications:
            app = req.applications[0]
            order = Order.create(req, app)
            if i == 0:
                order.status = "in_progress"
                order.contract_confirmed = True
                for day in range(3):
                    order.add_daily_log(
                        foster_id=app["foster_id"],
                        photos=[pet_avatars[(day + i) % len(pet_avatars)]],
                        content=f"第{day+1}天：{req.pet_name}今天状态很好，吃了两碗狗粮，外出散步了两次。"
                    )
            elif i == 1:
                order.status = "completed"
                order.contract_confirmed = True
            orders_db[order.id] = order


generate_sample_data()


@app.route('/api/requirements', methods=['GET'])
def get_requirements():
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    pet_type = request.args.get('pet_type', None, type=str)
    min_budget = request.args.get('min_budget', None, type=float)
    max_budget = request.args.get('max_budget', None, type=float)

    all_reqs = list(requirements_db.values())

    if pet_type and pet_type != 'all':
        all_reqs = [r for r in all_reqs if r.pet_breed == pet_type]
    if min_budget is not None:
        all_reqs = [r for r in all_reqs if r.daily_budget >= min_budget]
    if max_budget is not None:
        all_reqs = [r for r in all_reqs if r.daily_budget <= max_budget]

    total = len(all_reqs)
    start = (page - 1) * per_page
    end = start + per_page
    paginated = all_reqs[start:end]

    return jsonify({
        "total": total,
        "page": page,
        "per_page": per_page,
        "data": [r.__dict__ for r in paginated]
    })


@app.route('/api/requirements', methods=['POST'])
def create_requirement():
    data = request.json
    req = Requirement.create(
        pet_name=data['pet_name'],
        pet_breed=data['pet_breed'],
        pet_age=data['pet_age'],
        pet_personality=data.get('pet_personality', []),
        pet_avatar=data.get('pet_avatar', 'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=400'),
        start_date=data['start_date'],
        end_date=data['end_date'],
        daily_budget=data['daily_budget'],
        owner_id=data.get('owner_id', 'anonymous'),
        owner_name=data.get('owner_name', '匿名用户')
    )
    requirements_db[req.id] = req
    return jsonify(req.__dict__), 201


@app.route('/api/requirements/<req_id>', methods=['GET'])
def get_requirement(req_id):
    req = requirements_db.get(req_id)
    if not req:
        return jsonify({"error": "Requirement not found"}), 404
    return jsonify(req.__dict__)


@app.route('/api/requirements/<req_id>/applications', methods=['POST'])
def add_application(req_id):
    req = requirements_db.get(req_id)
    if not req:
        return jsonify({"error": "Requirement not found"}), 404
    data = request.json
    application = req.add_application(
        foster_id=data['foster_id'],
        foster_name=data['foster_name'],
        foster_rating=data.get('foster_rating', 5.0),
        foster_intro=data.get('foster_intro', ''),
        foster_avatar=data.get('foster_avatar', '')
    )
    return jsonify(application), 201


@app.route('/api/requirements/<req_id>/applications/<app_id>/accept', methods=['POST'])
def accept_application(req_id, app_id):
    req = requirements_db.get(req_id)
    if not req:
        return jsonify({"error": "Requirement not found"}), 404
    application = req.accept_application(app_id)
    if not application:
        return jsonify({"error": "Application not found"}), 404

    order = Order.create(req, application)
    orders_db[order.id] = order

    return jsonify({
        "message": "Application accepted, order created",
        "order": order.__dict__
    })


@app.route('/api/orders', methods=['GET'])
def get_orders():
    status = request.args.get('status', None, type=str)
    sort_by_date = request.args.get('sort_by_date', 'desc', type=str)

    all_orders = list(orders_db.values())

    if status and status != 'all':
        all_orders = [o for o in all_orders if o.status == status]

    if sort_by_date == 'desc':
        all_orders.sort(key=lambda o: o.created_at, reverse=True)
    else:
        all_orders.sort(key=lambda o: o.created_at)

    return jsonify({
        "total": len(all_orders),
        "data": [o.__dict__ for o in all_orders]
    })


@app.route('/api/orders/<order_id>', methods=['GET'])
def get_order(order_id):
    order = orders_db.get(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    return jsonify(order.__dict__)


@app.route('/api/orders/<order_id>/confirm-payment', methods=['POST'])
def confirm_payment(order_id):
    order = orders_db.get(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    if order.confirm_payment():
        return jsonify(order.__dict__)
    return jsonify({"error": "Cannot confirm payment for current status"}), 400


@app.route('/api/orders/<order_id>/complete', methods=['POST'])
def complete_order(order_id):
    order = orders_db.get(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    if order.complete_order():
        return jsonify(order.__dict__)
    return jsonify({"error": "Cannot complete order for current status"}), 400


@app.route('/api/orders/<order_id>/logs', methods=['POST'])
def add_daily_log(order_id):
    order = orders_db.get(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    data = request.json
    log = order.add_daily_log(
        foster_id=data['foster_id'],
        photos=data.get('photos', []),
        content=data['content']
    )
    return jsonify(log), 201


@app.route('/api/orders/<order_id>/logs/<log_id>/comments', methods=['POST'])
def add_log_comment(order_id, log_id):
    order = orders_db.get(order_id)
    if not order:
        return jsonify({"error": "Order not found"}), 404
    data = request.json
    comment = order.add_comment_to_log(
        log_id=log_id,
        user_id=data['user_id'],
        user_name=data['user_name'],
        content=data['content']
    )
    if comment:
        return jsonify(comment), 201
    return jsonify({"error": "Log not found"}), 404


@app.route('/api/fosters', methods=['GET'])
def get_fosters():
    return jsonify({
        "total": len(fosters_db),
        "data": [f.__dict__ for f in fosters_db.values()]
    })


@app.route('/api/fosters/<foster_id>', methods=['GET'])
def get_foster(foster_id):
    foster = fosters_db.get(foster_id)
    if not foster:
        return jsonify({"error": "Foster family not found"}), 404
    return jsonify(foster.__dict__)


@app.route('/api/notifications', methods=['GET'])
def get_notifications():
    return jsonify({
        "data": [
            {"id": "1", "type": "new_application", "message": "您的寄养需求有新的申请", "read": False},
            {"id": "2", "type": "order_update", "message": "您的寄养订单状态已更新", "read": True},
        ]
    })


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
