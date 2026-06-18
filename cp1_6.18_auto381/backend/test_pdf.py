import requests

response = requests.get('http://127.0.0.1:8000/api/meetings/1/pdf')
if response.status_code == 200:
    with open('test_meeting.pdf', 'wb') as f:
        f.write(response.content)
    print(f'PDF生成成功！文件大小: {len(response.content)} 字节')
    ct = response.headers.get('Content-Type')
    cd = response.headers.get('Content-Disposition')
    print(f'Content-Type: {ct}')
    print(f'Content-Disposition: {cd}')
else:
    print(f'PDF生成失败: {response.status_code} - {response.text}')
