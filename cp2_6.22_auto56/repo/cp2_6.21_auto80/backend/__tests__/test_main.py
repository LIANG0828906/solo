import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient
from main import app, orders_db

client = TestClient(app)

VALID_FLAVOR_IDS = {'sea-salt-caramel', 'matcha', 'dark-chocolate', 'strawberry', 'pistachio', 'baileys'}


@pytest.fixture(autouse=True)
def clear_db():
    orders_db.clear()


def create_valid_order(chocolate_count=3):
    chocolates = []
    flavors = list(VALID_FLAVOR_IDS)
    for i in range(chocolate_count):
        chocolates.append({
            'id': f'choco-{i}',
            'flavorId': flavors[i % len(flavors)],
            'shape': 'circle',
            'color': '#5D4037',
            'texture': 'glossy'
        })
    return {
        'chocolates': chocolates,
        'giftBox': {
            'boxShape': 'square',
            'ribbonColor': '#D4AF37',
            'cardText': 'Happy Birthday!',
            'cardFont': 'Playfair Display',
            'cardColor': '#3E2723'
        }
    }


class TestCreateOrder:
    def test_post_orders_with_valid_data_returns_200_with_orderId(self):
        order_data = create_valid_order(3)
        response = client.post('/api/orders', json=order_data)
        
        assert response.status_code == 200
        assert 'orderId' in response.json()
        assert response.json()['status'] == 'pending'
        assert 'createdAt' in response.json()
        assert len(response.json()['chocolates']) == 3

    def test_post_orders_with_less_than_3_chocolates_returns_400(self):
        order_data = create_valid_order(2)
        response = client.post('/api/orders', json=order_data)
        
        assert response.status_code == 400
        assert '巧克力数量必须在3-6颗之间' in response.json()['detail']

    def test_post_orders_with_more_than_6_chocolates_returns_400(self):
        order_data = create_valid_order(7)
        response = client.post('/api/orders', json=order_data)
        
        assert response.status_code == 400
        assert '巧克力数量必须在3-6颗之间' in response.json()['detail']

    def test_post_orders_with_invalid_flavorId_returns_400(self):
        order_data = create_valid_order(3)
        order_data['chocolates'][0]['flavorId'] = 'invalid-flavor'
        response = client.post('/api/orders', json=order_data)
        
        assert response.status_code == 400
        assert '无效的口味ID' in response.json()['detail']

    def test_post_orders_with_invalid_color_format_returns_400(self):
        order_data = create_valid_order(3)
        order_data['chocolates'][0]['color'] = 'invalid-color'
        response = client.post('/api/orders', json=order_data)
        
        assert response.status_code == 400
        assert '无效的巧克力颜色格式' in response.json()['detail']

    def test_post_orders_with_valid_3_digit_shorthand_color_gets_normalized_to_6_digit(self):
        order_data = create_valid_order(3)
        order_data['chocolates'][0]['color'] = '#ABC'
        response = client.post('/api/orders', json=order_data)
        
        assert response.status_code == 200
        assert response.json()['chocolates'][0]['color'] == '#aabbcc'

    def test_post_orders_with_valid_6_digit_color_remains_unchanged(self):
        order_data = create_valid_order(3)
        order_data['chocolates'][0]['color'] = '#AABBCC'
        response = client.post('/api/orders', json=order_data)
        
        assert response.status_code == 200
        assert response.json()['chocolates'][0]['color'] == '#aabbcc'

    def test_post_orders_with_invalid_shape_returns_400(self):
        order_data = create_valid_order(3)
        order_data['chocolates'][0]['shape'] = 'invalid-shape'
        response = client.post('/api/orders', json=order_data)
        
        assert response.status_code == 400
        assert '无效的形状' in response.json()['detail']

    def test_post_orders_with_invalid_texture_returns_400(self):
        order_data = create_valid_order(3)
        order_data['chocolates'][0]['texture'] = 'invalid-texture'
        response = client.post('/api/orders', json=order_data)
        
        assert response.status_code == 400
        assert '无效的纹理' in response.json()['detail']

    def test_post_orders_with_invalid_box_shape_returns_400(self):
        order_data = create_valid_order(3)
        order_data['giftBox']['boxShape'] = 'invalid-box'
        response = client.post('/api/orders', json=order_data)
        
        assert response.status_code == 400
        assert '无效的礼盒形状' in response.json()['detail']

    def test_post_orders_with_ribbon_gradient_normalizes_colors(self):
        order_data = create_valid_order(3)
        order_data['giftBox']['ribbonColor'] = 'linear-gradient(135deg,#ABC,#DEF)'
        response = client.post('/api/orders', json=order_data)
        
        assert response.status_code == 200
        assert '#aabbcc' in response.json()['giftBox']['ribbonColor']
        assert '#ddeeff' in response.json()['giftBox']['ribbonColor']


class TestGetOrders:
    def test_get_orders_returns_list_of_orders(self):
        for i in range(2):
            client.post('/api/orders', json=create_valid_order(3))
        
        response = client.get('/api/orders')
        
        assert response.status_code == 200
        assert isinstance(response.json(), list)
        assert len(response.json()) == 2

    def test_get_orders_empty_returns_empty_list(self):
        response = client.get('/api/orders')
        
        assert response.status_code == 200
        assert response.json() == []

    def test_get_order_by_id_returns_correct_order(self):
        create_response = client.post('/api/orders', json=create_valid_order(3))
        order_id = create_response.json()['orderId']
        
        response = client.get(f'/api/orders/{order_id}')
        
        assert response.status_code == 200
        assert response.json()['orderId'] == order_id
        assert len(response.json()['chocolates']) == 3

    def test_get_order_with_invalid_id_returns_404(self):
        response = client.get('/api/orders/invalid-order-id')
        
        assert response.status_code == 404
        assert 'Order not found' in response.json()['detail']
