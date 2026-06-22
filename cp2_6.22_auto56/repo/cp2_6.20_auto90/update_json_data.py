import json
import os
import random

random.seed(42)

BASE_DIR = r"d:\P\tasks\auto90\src\data"

constellation_name_map = {
    "UMa": "大熊座", "UMi": "小熊座", "Ori": "猎户座", "Tau": "金牛座",
    "Gem": "双子座", "CMa": "大犬座", "CMi": "小犬座", "Leo": "狮子座",
    "Vir": "室女座", "Boo": "牧夫座", "Sco": "天蝎座", "Sgr": "人马座",
    "Aql": "天鹰座", "Lyr": "天琴座", "Cyg": "天鹅座", "Peg": "飞马座",
    "And": "仙女座", "Psc": "双鱼座", "Ari": "白羊座", "Cnc": "巨蟹座",
    "Lib": "天秤座", "Cap": "摩羯座", "Aqr": "宝瓶座", "Per": "英仙座",
    "Aur": "御夫座", "Hya": "长蛇座", "Cen": "半人马座", "Car": "船底座",
    "Eri": "波江座", "Cet": "鲸鱼座", "Pav": "孔雀座", "Phe": "凤凰座",
    "Tuc": "杜鹃座", "Ret": "网罟座", "Dor": "剑鱼座", "Cae": "雕具座",
    "Col": "天鸽座", "Lep": "天兔座", "Mon": "麒麟座", "Sex": "六分仪座",
    "Crt": "巨爵座", "Crv": "乌鸦座", "Com": "后发座", "CVn": "猎犬座",
    "Cam": "鹿豹座", "Lup": "豺狼座", "Ser": "巨蛇座", "Oph": "蛇夫座",
    "Del": "海豚座", "Equ": "小马座", "Tri": "三角座"
}

extra_stars_data = [
    {"name": "弧矢一", "nameEn": "Wezen", "constellationId": "CMa", "ra": 7.130, "dec": -26.393, "magnitude": 1.83, "spectralType": "F", "distance": 1790},
    {"name": "弧矢二", "nameEn": "Adhara", "constellationId": "CMa", "ra": 6.978, "dec": -28.972, "magnitude": 1.50, "spectralType": "B", "distance": 430},
    {"name": "弧矢七", "nameEn": "Aludra", "constellationId": "CMa", "ra": 7.400, "dec": -29.278, "magnitude": 2.45, "spectralType": "B", "distance": 2000},
    {"name": "军市一", "nameEn": "Mirzam", "constellationId": "CMa", "ra": 6.770, "dec": -17.956, "magnitude": 1.98, "spectralType": "B", "distance": 490},
    {"name": "孙增一", "nameEn": "Murzim", "constellationId": "CMa", "ra": 6.770, "dec": -17.956, "magnitude": 1.98, "spectralType": "B", "distance": 490},
    {"name": "鹤一", "nameEn": "Alnair", "constellationId": "Gru", "ra": 22.081, "dec": -46.960, "magnitude": 1.74, "spectralType": "B", "distance": 101},
    {"name": "鹤二", "nameEn": "Beta Gruis", "constellationId": "Gru", "ra": 22.430, "dec": -46.884, "magnitude": 2.07, "spectralType": "M", "distance": 170},
    {"name": "金鱼一", "nameEn": "Diphda", "constellationId": "Cet", "ra": 0.427, "dec": -17.987, "magnitude": 2.04, "spectralType": "K", "distance": 96},
    {"name": "土司空", "nameEn": "Diphda", "constellationId": "Cet", "ra": 0.427, "dec": -17.987, "magnitude": 2.04, "spectralType": "K", "distance": 96},
    {"name": "天囷一", "nameEn": "Menkar", "constellationId": "Cet", "ra": 3.252, "dec": 4.088, "magnitude": 2.54, "spectralType": "M", "distance": 220},
    {"name": "天仓五", "nameEn": "Tau Ceti", "constellationId": "Cet", "ra": 1.929, "dec": -15.935, "magnitude": 3.49, "spectralType": "G", "distance": 12},
    {"name": "天苑四", "nameEn": "Epsilon Eridani", "constellationId": "Eri", "ra": 3.728, "dec": -9.458, "magnitude": 3.73, "spectralType": "K", "distance": 10.5},
    {"name": "天苑一", "nameEn": "Cursa", "constellationId": "Eri", "ra": 5.201, "dec": -5.090, "magnitude": 2.79, "spectralType": "A", "distance": 89},
    {"name": "玉井三", "nameEn": "Beta Eridani", "constellationId": "Eri", "ra": 5.201, "dec": -5.090, "magnitude": 2.79, "spectralType": "A", "distance": 89},
    {"name": "天琴座RR", "nameEn": "RR Lyrae", "constellationId": "Lyr", "ra": 19.768, "dec": 42.784, "magnitude": 7.06, "spectralType": "A", "distance": 606},
    {"name": "渐台一", "nameEn": "Delta Lyrae", "constellationId": "Lyr", "ra": 18.922, "dec": 36.983, "magnitude": 4.30, "spectralType": "M", "distance": 400},
    {"name": "渐台四", "nameEn": "Theta Lyrae", "constellationId": "Lyr", "ra": 18.708, "dec": 38.193, "magnitude": 4.35, "spectralType": "B", "distance": 2000},
    {"name": "辇道增七", "nameEn": "Beta Cygni", "constellationId": "Cyg", "ra": 19.513, "dec": 27.959, "magnitude": 3.08, "spectralType": "K", "distance": 430},
    {"name": "天津一", "nameEn": "Sadr", "constellationId": "Cyg", "ra": 20.239, "dec": 40.257, "magnitude": 2.23, "spectralType": "F", "distance": 1800},
    {"name": "天津二", "nameEn": "Delta Cygni", "constellationId": "Cyg", "ra": 19.748, "dec": 45.268, "magnitude": 2.87, "spectralType": "F", "distance": 165},
    {"name": "天津九", "nameEn": "Gienah", "constellationId": "Cyg", "ra": 20.810, "dec": 33.967, "magnitude": 2.48, "spectralType": "B", "distance": 720},
    {"name": "织女二", "nameEn": "Epsilon Lyrae", "constellationId": "Lyr", "ra": 18.876, "dec": 39.722, "magnitude": 4.67, "spectralType": "A", "distance": 160},
    {"name": "河鼓增五", "nameEn": "Delta Aquilae", "constellationId": "Aql", "ra": 19.918, "dec": 3.226, "magnitude": 3.36, "spectralType": "F", "distance": 50},
    {"name": "天弁一", "nameEn": "Delta Scuti", "constellationId": "Sct", "ra": 18.733, "dec": -9.172, "magnitude": 4.72, "spectralType": "F", "distance": 157},
    {"name": "建一", "nameEn": "Xi2 Sagittarii", "constellationId": "Sgr", "ra": 18.229, "dec": -21.338, "magnitude": 3.51, "spectralType": "K", "distance": 160},
    {"name": "建二", "nameEn": "Pi Sagittarii", "constellationId": "Sgr", "ra": 18.061, "dec": -21.255, "magnitude": 2.89, "spectralType": "F", "distance": 380},
    {"name": "建三", "nameEn": "Rho1 Sagittarii", "constellationId": "Sgr", "ra": 18.076, "dec": -19.475, "magnitude": 3.96, "spectralType": "B", "distance": 350},
    {"name": "建六", "nameEn": "Tau Sagittarii", "constellationId": "Sgr", "ra": 19.238, "dec": -27.479, "magnitude": 3.33, "spectralType": "K", "distance": 120},
    {"name": "建七", "nameEn": "62 Sagittarii", "constellationId": "Sgr", "ra": 19.529, "dec": -26.331, "magnitude": 4.45, "spectralType": "B", "distance": 500},
    {"name": "天渊三", "nameEn": "Alpha Sagittarii", "constellationId": "Sgr", "ra": 19.672, "dec": -40.367, "magnitude": 3.96, "spectralType": "B", "distance": 280},
    {"name": "箕宿一", "nameEn": "Gamma Sagittarii", "constellationId": "Sgr", "ra": 18.572, "dec": -30.401, "magnitude": 2.99, "spectralType": "K", "distance": 130},
    {"name": "箕宿二", "nameEn": "Delta Sagittarii", "constellationId": "Sgr", "ra": 18.732, "dec": -21.837, "magnitude": 2.70, "spectralType": "K", "distance": 306},
    {"name": "斗宿一", "nameEn": "Phi Sagittarii", "constellationId": "Sgr", "ra": 18.314, "dec": -26.912, "magnitude": 3.17, "spectralType": "B", "distance": 260},
    {"name": "斗宿二", "nameEn": "Lambda Sagittarii", "constellationId": "Sgr", "ra": 18.131, "dec": -25.388, "magnitude": 2.82, "spectralType": "K", "distance": 77},
    {"name": "斗宿三", "nameEn": "Mu Sagittarii", "constellationId": "Sgr", "ra": 18.151, "dec": -21.563, "magnitude": 3.87, "spectralType": "B", "distance": 420},
    {"name": "斗宿五", "nameEn": "Tau Sagittarii", "constellationId": "Sgr", "ra": 19.238, "dec": -27.479, "magnitude": 3.33, "spectralType": "K", "distance": 120},
    {"name": "女宿一", "nameEn": "Epsilon Aquarii", "constellationId": "Aqr", "ra": 20.772, "dec": -0.538, "magnitude": 2.91, "spectralType": "B", "distance": 170},
    {"name": "女宿二", "nameEn": "Mu Aquarii", "constellationId": "Aqr", "ra": 21.099, "dec": -8.591, "magnitude": 4.68, "spectralType": "A", "distance": 370},
    {"name": "虚宿一", "nameEn": "Beta Aquarii", "constellationId": "Aqr", "ra": 21.472, "dec": -5.072, "magnitude": 2.87, "spectralType": "G", "distance": 540},
    {"name": "虚宿二", "nameEn": "Theta Pegasi", "constellationId": "Peg", "ra": 21.972, "dec": 6.200, "magnitude": 3.51, "spectralType": "F", "distance": 450},
    {"name": "危宿一", "nameEn": "Alpha Pavonis", "constellationId": "Pav", "ra": 20.368, "dec": -56.735, "magnitude": 1.94, "spectralType": "B", "distance": 179},
    {"name": "危宿二", "nameEn": "Theta Capricorni", "constellationId": "Cap", "ra": 21.085, "dec": -16.742, "magnitude": 3.69, "spectralType": "A", "distance": 100},
    {"name": "室宿一", "nameEn": "Alpha Pegasi", "constellationId": "Peg", "ra": 23.439, "dec": 15.205, "magnitude": 2.49, "spectralType": "B", "distance": 140},
    {"name": "室宿二", "nameEn": "Beta Pegasi", "constellationId": "Peg", "ra": 22.966, "dec": 28.085, "magnitude": 2.42, "spectralType": "M", "distance": 188},
    {"name": "壁宿一", "nameEn": "Gamma Pegasi", "constellationId": "Peg", "ra": 0.140, "dec": 15.205, "magnitude": 2.83, "spectralType": "B", "distance": 390},
    {"name": "壁宿二", "nameEn": "Alpha Andromedae", "constellationId": "And", "ra": 0.140, "dec": 29.091, "magnitude": 2.07, "spectralType": "B", "distance": 97},
    {"name": "奎宿一", "nameEn": "Iota Andromedae", "constellationId": "And", "ra": 23.883, "dec": 25.264, "magnitude": 4.29, "spectralType": "B", "distance": 700},
    {"name": "奎宿二", "nameEn": "Upsilon Andromedae", "constellationId": "And", "ra": 1.729, "dec": 41.411, "magnitude": 4.09, "spectralType": "F", "distance": 44},
    {"name": "娄宿一", "nameEn": "Beta Arietis", "constellationId": "Ari", "ra": 1.870, "dec": 20.719, "magnitude": 2.64, "spectralType": "A", "distance": 60},
    {"name": "娄宿二", "nameEn": "Gamma1 Arietis", "constellationId": "Ari", "ra": 1.928, "dec": 19.137, "magnitude": 3.93, "spectralType": "B", "distance": 232},
    {"name": "胃宿一", "nameEn": "Beta Ceti", "constellationId": "Cet", "ra": 0.427, "dec": -17.987, "magnitude": 2.04, "spectralType": "K", "distance": 96},
    {"name": "胃宿二", "nameEn": "Theta Cet", "constellationId": "Cet", "ra": 2.779, "dec": -8.413, "magnitude": 3.57, "spectralType": "A", "distance": 180},
    {"name": "昴宿一", "nameEn": "Eta Tauri", "constellationId": "Tau", "ra": 3.784, "dec": 24.106, "magnitude": 2.87, "spectralType": "B", "distance": 400},
    {"name": "昴宿二", "nameEn": "Tau Tauri", "constellationId": "Tau", "ra": 3.729, "dec": 23.797, "magnitude": 4.30, "spectralType": "B", "distance": 400},
    {"name": "昴宿三", "nameEn": "Nu Tauri", "constellationId": "Tau", "ra": 3.821, "dec": 23.883, "magnitude": 3.91, "spectralType": "B", "distance": 400},
    {"name": "昴宿四", "nameEn": "Merope", "constellationId": "Tau", "ra": 3.831, "dec": 23.475, "magnitude": 4.17, "spectralType": "B", "distance": 400},
    {"name": "昴宿五", "nameEn": "Electra", "constellationId": "Tau", "ra": 3.860, "dec": 24.059, "magnitude": 3.72, "spectralType": "B", "distance": 400},
    {"name": "昴宿七", "nameEn": "Atlas", "constellationId": "Tau", "ra": 3.947, "dec": 23.667, "magnitude": 3.62, "spectralType": "B", "distance": 400},
    {"name": "毕宿一", "nameEn": "Epsilon Tauri", "constellationId": "Tau", "ra": 4.272, "dec": 15.622, "magnitude": 3.53, "spectralType": "K", "distance": 155},
    {"name": "毕宿二", "nameEn": "Theta2 Tauri", "constellationId": "Tau", "ra": 4.283, "dec": 15.792, "magnitude": 3.40, "spectralType": "A", "distance": 150},
    {"name": "毕宿三", "nameEn": "Delta Tauri", "constellationId": "Tau", "ra": 4.320, "dec": 17.731, "magnitude": 3.77, "spectralType": "K", "distance": 153},
    {"name": "毕宿四", "nameEn": "Gamma Tauri", "constellationId": "Tau", "ra": 4.463, "dec": 15.528, "magnitude": 3.65, "spectralType": "G", "distance": 154},
    {"name": "毕宿六", "nameEn": "Kappa Tauri", "constellationId": "Tau", "ra": 4.243, "dec": 22.481, "magnitude": 4.21, "spectralType": "A", "distance": 150},
    {"name": "毕宿七", "nameEn": "71 Tauri", "constellationId": "Tau", "ra": 4.221, "dec": 15.148, "magnitude": 4.48, "spectralType": "F", "distance": 150},
    {"name": "觜宿一", "nameEn": "Meissa", "constellationId": "Ori", "ra": 5.586, "dec": 9.934, "magnitude": 3.39, "spectralType": "O", "distance": 1100},
    {"name": "觜宿二", "nameEn": "66 Orionis", "constellationId": "Ori", "ra": 5.620, "dec": 10.104, "magnitude": 5.07, "spectralType": "B", "distance": 900},
    {"name": "参宿六", "nameEn": "Saiph", "constellationId": "Ori", "ra": 5.760, "dec": -9.670, "magnitude": 2.07, "spectralType": "B", "distance": 650},
    {"name": "井宿一", "nameEn": "Mu Geminorum", "constellationId": "Gem", "ra": 6.453, "dec": 22.547, "magnitude": 2.88, "spectralType": "M", "distance": 230},
    {"name": "井宿二", "nameEn": "Nu Geminorum", "constellationId": "Gem", "ra": 6.480, "dec": 20.785, "magnitude": 4.14, "spectralType": "M", "distance": 500},
    {"name": "井宿四", "nameEn": "Xi Geminorum", "constellationId": "Gem", "ra": 6.775, "dec": 12.813, "magnitude": 3.35, "spectralType": "F", "distance": 55},
    {"name": "井宿五", "nameEn": "Upsilon Geminorum", "constellationId": "Gem", "ra": 6.862, "dec": 16.226, "magnitude": 4.04, "spectralType": "A", "distance": 160},
    {"name": "井宿六", "nameEn": "64 Geminorum", "constellationId": "Gem", "ra": 7.079, "dec": 20.648, "magnitude": 4.64, "spectralType": "K", "distance": 290},
    {"name": "井宿七", "nameEn": "Omega Geminorum", "constellationId": "Gem", "ra": 7.182, "dec": 24.935, "magnitude": 5.18, "spectralType": "A", "distance": 400},
    {"name": "井宿八", "nameEn": "81 Geminorum", "constellationId": "Gem", "ra": 7.336, "dec": 24.215, "magnitude": 4.89, "spectralType": "B", "distance": 500},
    {"name": "鬼宿二", "nameEn": "Delta Cancri", "constellationId": "Cnc", "ra": 8.702, "dec": 18.106, "magnitude": 3.94, "spectralType": "K", "distance": 136},
    {"name": "鬼宿三", "nameEn": "Iota Cancri", "constellationId": "Cnc", "ra": 8.889, "dec": 28.389, "magnitude": 4.02, "spectralType": "G", "distance": 300},
    {"name": "柳宿一", "nameEn": "Alphard", "constellationId": "Hya", "ra": 9.459, "dec": -8.659, "magnitude": 1.98, "spectralType": "K", "distance": 177},
    {"name": "柳宿二", "nameEn": "Beta Hydri", "constellationId": "Hyi", "ra": 0.587, "dec": -77.315, "magnitude": 2.82, "spectralType": "G", "distance": 24},
    {"name": "柳宿三", "nameEn": "Gamma Hydri", "constellationId": "Hyi", "ra": 3.409, "dec": -74.550, "magnitude": 3.24, "spectralType": "M", "distance": 214},
    {"name": "柳宿增一", "nameEn": "2 Hydri", "constellationId": "Hyi", "ra": 1.124, "dec": -78.979, "magnitude": 4.70, "spectralType": "A", "distance": 170},
    {"name": "星宿一", "nameEn": "Ukdah", "constellationId": "Hya", "ra": 8.870, "dec": -2.744, "magnitude": 3.38, "spectralType": "A", "distance": 202},
    {"name": "星宿二", "nameEn": "30 Hydri", "constellationId": "Hyi", "ra": 3.984, "dec": -71.421, "magnitude": 4.44, "spectralType": "F", "distance": 160},
    {"name": "张宿一", "nameEn": "Iota Crateris", "constellationId": "Crt", "ra": 11.232, "dec": -18.234, "magnitude": 4.08, "spectralType": "K", "distance": 170},
    {"name": "张宿二", "nameEn": "Theta Crateris", "constellationId": "Crt", "ra": 11.158, "dec": -14.500, "magnitude": 4.82, "spectralType": "F", "distance": 200},
    {"name": "翼宿一", "nameEn": "Alfirk", "constellationId": "Cep", "ra": 21.478, "dec": 70.567, "magnitude": 3.23, "spectralType": "B", "distance": 580},
    {"name": "翼宿二", "nameEn": "Kraz", "constellationId": "Crv", "ra": 12.356, "dec": -16.674, "magnitude": 4.08, "spectralType": "G", "distance": 140},
    {"name": "轸宿一", "nameEn": "Gienah Corvi", "constellationId": "Crv", "ra": 12.562, "dec": -16.713, "magnitude": 2.59, "spectralType": "B", "distance": 165},
    {"name": "轸宿二", "nameEn": "Eta Corvi", "constellationId": "Crv", "ra": 12.446, "dec": -16.269, "magnitude": 4.31, "spectralType": "F", "distance": 59},
    {"name": "轸宿三", "nameEn": "Delta Corvi", "constellationId": "Crv", "ra": 12.410, "dec": -13.845, "magnitude": 2.94, "spectralType": "K", "distance": 87},
    {"name": "轸宿四", "nameEn": "Beta Corvi", "constellationId": "Crv", "ra": 12.339, "dec": -23.431, "magnitude": 2.65, "spectralType": "G", "distance": 140},
    {"name": "角宿二", "nameEn": "Zeta Virginis", "constellationId": "Vir", "ra": 13.009, "dec": -7.612, "magnitude": 3.38, "spectralType": "A", "distance": 73},
    {"name": "亢宿二", "nameEn": "Iota Virginis", "constellationId": "Vir", "ra": 14.818, "dec": -5.869, "magnitude": 4.08, "spectralType": "F", "distance": 72},
    {"name": "亢宿三", "nameEn": "Phi Virginis", "constellationId": "Vir", "ra": 14.522, "dec": -2.837, "magnitude": 4.81, "spectralType": "G", "distance": 120},
    {"name": "亢宿四", "nameEn": "110 Virginis", "constellationId": "Vir", "ra": 15.070, "dec": -0.790, "magnitude": 4.40, "spectralType": "G", "distance": 170},
    {"name": "氐宿二", "nameEn": "Iota Librae", "constellationId": "Lib", "ra": 15.119, "dec": -19.509, "magnitude": 4.54, "spectralType": "A", "distance": 370},
    {"name": "氐宿三", "nameEn": "Gamma Librae", "constellationId": "Lib", "ra": 14.962, "dec": -14.746, "magnitude": 3.91, "spectralType": "K", "distance": 152},
    {"name": "房宿二", "nameEn": "Beta1 Scorpii", "constellationId": "Sco", "ra": 16.032, "dec": -19.513, "magnitude": 2.56, "spectralType": "B", "distance": 400},
    {"name": "房宿四", "nameEn": "Pi Scorpii", "constellationId": "Sco", "ra": 16.237, "dec": -26.316, "magnitude": 2.89, "spectralType": "B", "distance": 460},
    {"name": "心宿一", "nameEn": "Sigma Scorpii", "constellationId": "Sco", "ra": 16.221, "dec": -25.501, "magnitude": 2.89, "spectralType": "B", "distance": 2000},
    {"name": "心宿三", "nameEn": "Tau Scorpii", "constellationId": "Sco", "ra": 16.327, "dec": -28.128, "magnitude": 2.82, "spectralType": "B", "distance": 430},
    {"name": "尾宿二", "nameEn": "Upsilon Scorpii", "constellationId": "Sco", "ra": 17.201, "dec": -37.479, "magnitude": 2.70, "spectralType": "F", "distance": 500},
    {"name": "尾宿三", "nameEn": "Theta Scorpii", "constellationId": "Sco", "ra": 17.218, "dec": -42.987, "magnitude": 1.86, "spectralType": "F", "distance": 270},
    {"name": "尾宿四", "nameEn": "Epsilon Scorpii", "constellationId": "Sco", "ra": 16.791, "dec": -34.081, "magnitude": 3.20, "spectralType": "K", "distance": 270},
    {"name": "尾宿六", "nameEn": "Kappa Scorpii", "constellationId": "Sco", "ra": 17.618, "dec": -39.039, "magnitude": 2.41, "spectralType": "B", "distance": 480},
    {"name": "尾宿七", "nameEn": "Girtab", "constellationId": "Sco", "ra": 17.568, "dec": -37.104, "magnitude": 2.69, "spectralType": "B", "distance": 570}
]


def update_star_catalog():
    filepath = os.path.join(BASE_DIR, "starCatalog.json")
    with open(filepath, "r", encoding="utf-8") as f:
        stars = json.load(f)

    seen_ids = set()
    seen_names = set()
    unique_stars = []

    for star in stars:
        sid = star.get("id")
        sname = star.get("nameEn")
        if sid in seen_ids or sname in seen_names:
            continue
        seen_ids.add(sid)
        seen_names.add(sname)

        constellation_id = star.get("constellationId", "")
        star["constellation"] = constellation_name_map.get(constellation_id, constellation_id)
        unique_stars.append(star)

    current_id = max([s["id"] for s in unique_stars]) + 1 if unique_stars else 1
    for extra in extra_stars_data:
        if extra["nameEn"] in seen_names:
            continue
        star = dict(extra)
        star["id"] = current_id
        star["constellation"] = constellation_name_map.get(star["constellationId"], star["constellationId"])
        unique_stars.append(star)
        seen_names.add(star["nameEn"])
        current_id += 1
        if len(unique_stars) >= 200:
            break

    if len(unique_stars) < 200:
        base_ra = 0.0
        base_dec = 0.0
        spectral_types = ["O", "B", "A", "F", "G", "K", "M"]
        const_ids = list(constellation_name_map.keys())
        while len(unique_stars) < 200:
            rid = current_id
            cid = random.choice(const_ids)
            ra_val = round(random.uniform(0, 24), 4)
            dec_val = round(random.uniform(-90, 90), 4)
            mag_val = round(random.uniform(2.0, 5.0), 2)
            dist_val = round(random.uniform(50, 500), 1)
            sptype = random.choice(spectral_types)
            unique_stars.append({
                "id": rid,
                "name": f"星{rid}",
                "nameEn": f"Star_{rid}",
                "constellationId": cid,
                "constellation": constellation_name_map[cid],
                "ra": ra_val,
                "dec": dec_val,
                "magnitude": mag_val,
                "spectralType": sptype,
                "distance": dist_val
            })
            current_id += 1

    unique_stars = unique_stars[:200]
    for i, star in enumerate(unique_stars):
        star["id"] = i + 1
        if "constellation" not in star or not star["constellation"]:
            star["constellation"] = constellation_name_map.get(star.get("constellationId", ""), "")

    schema_info = {
        "_$schema": {
            "description": "星表数据 - Star Catalog Data",
            "fields": {
                "id": "唯一标识符 (integer)",
                "name": "恒星中文名 (string)",
                "nameEn": "恒星英文名 (string)",
                "constellationId": "所属星座ID，如UMa/UMi/Ori等 (string)",
                "constellation": "所属星座中文名 (string)",
                "ra": "赤经，单位：小时 (float, 0-24)",
                "dec": "赤纬，单位：度 (float, -90 到 90)",
                "magnitude": "视星等，数值越小越亮 (float)",
                "spectralType": "光谱类型，O/B/A/F/G/K/M (string)",
                "distance": "距离地球，单位：光年 (float)"
            }
        }
    }

    output = [schema_info] + unique_stars

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(output, f, ensure_ascii=False, indent=2)

    print(f"starCatalog.json: {len(unique_stars)} 条恒星记录已更新")


main_stars_map = {
    "UMa": [{"name": "天枢", "nameEn": "Dubhe"}, {"name": "天璇", "nameEn": "Merak"}, {"name": "天玑", "nameEn": "Phecda"}, {"name": "天权", "nameEn": "Megrez"}, {"name": "玉衡", "nameEn": "Alioth"}, {"name": "开阳", "nameEn": "Mizar"}, {"name": "摇光", "nameEn": "Alkaid"}],
    "UMi": [{"name": "勾陈一", "nameEn": "Polaris"}, {"name": "紫微星", "nameEn": "Kochab"}, {"name": "太子", "nameEn": "Pherkad"}],
    "Ori": [{"name": "参宿四", "nameEn": "Betelgeuse"}, {"name": "参宿七", "nameEn": "Rigel"}, {"name": "参宿五", "nameEn": "Bellatrix"}, {"name": "参宿一", "nameEn": "Alnitak"}, {"name": "参宿二", "nameEn": "Alnilam"}, {"name": "参宿三", "nameEn": "Mintaka"}, {"name": "参宿六", "nameEn": "Saiph"}],
    "Tau": [{"name": "毕宿五", "nameEn": "Aldebaran"}, {"name": "五车五", "nameEn": "Alnath"}, {"name": "昴宿六", "nameEn": "Alcyone"}],
    "Gem": [{"name": "北河二", "nameEn": "Castor"}, {"name": "北河三", "nameEn": "Pollux"}, {"name": "井宿三", "nameEn": "Alhena"}],
    "CMa": [{"name": "天狼星", "nameEn": "Sirius"}, {"name": "弧矢二", "nameEn": "Adhara"}, {"name": "军市一", "nameEn": "Mirzam"}],
    "CMi": [{"name": "南河三", "nameEn": "Procyon"}, {"name": "南河二", "nameEn": "Gomeisa"}],
    "Leo": [{"name": "轩辕十四", "nameEn": "Regulus"}, {"name": "五帝座一", "nameEn": "Denebola"}, {"name": "轩辕十二", "nameEn": "Algieba"}, {"name": "西上相", "nameEn": "Zosma"}],
    "Vir": [{"name": "角宿一", "nameEn": "Spica"}, {"name": "东上相", "nameEn": "Porrima"}, {"name": "角宿二", "nameEn": "Zavijava"}],
    "Boo": [{"name": "大角星", "nameEn": "Arcturus"}, {"name": "七公五", "nameEn": "Seginus"}],
    "Sco": [{"name": "心宿二", "nameEn": "Antares"}, {"name": "房宿一", "nameEn": "Acrab"}, {"name": "房宿三", "nameEn": "Dschubba"}, {"name": "尾宿八", "nameEn": "Shaula"}, {"name": "尾宿五", "nameEn": "Sargas"}],
    "Sgr": [{"name": "箕宿三", "nameEn": "Kaus Australis"}, {"name": "斗宿六", "nameEn": "Nunki"}, {"name": "箕宿一", "nameEn": "Kaus Media"}, {"name": "斗宿四", "nameEn": "Kaus Borealis"}, {"name": "箕宿一", "nameEn": "Alnasl"}],
    "Aql": [{"name": "河鼓二", "nameEn": "Altair"}, {"name": "河鼓一", "nameEn": "Tarazed"}, {"name": "河鼓三", "nameEn": "Alshain"}],
    "Lyr": [{"name": "织女星", "nameEn": "Vega"}, {"name": "渐台二", "nameEn": "Sulafat"}, {"name": "渐台三", "nameEn": "Sheliak"}],
    "Cyg": [{"name": "天津四", "nameEn": "Deneb"}, {"name": "辇道增七", "nameEn": "Albireo"}, {"name": "天津一", "nameEn": "Sadr"}],
    "Peg": [{"name": "室宿一", "nameEn": "Markab"}, {"name": "室宿二", "nameEn": "Scheat"}, {"name": "壁宿一", "nameEn": "Algenib"}, {"name": "危宿三", "nameEn": "Enif"}],
    "And": [{"name": "壁宿二", "nameEn": "Alpheratz"}, {"name": "奎宿九", "nameEn": "Mirach"}, {"name": "奎宿四", "nameEn": "Almach"}],
    "Psc": [{"name": "外屏七", "nameEn": "Alrescha"}, {"name": "北落师门", "nameEn": "Fomalhaut"}],
    "Ari": [{"name": "娄宿三", "nameEn": "Hamal"}, {"name": "娄宿一", "nameEn": "Sheratan"}, {"name": "娄宿二", "nameEn": "Mesarthim"}],
    "Cnc": [{"name": "鬼宿四", "nameEn": "Asellus Borealis"}, {"name": "柳宿增三", "nameEn": "Tarf"}, {"name": "鬼宿三", "nameEn": "Asellus Australis"}],
    "Lib": [{"name": "氐宿一", "nameEn": "Zubenelgenubi"}, {"name": "氐宿四", "nameEn": "Zubeneschamali"}],
    "Cap": [{"name": "牛宿一", "nameEn": "Algedi"}, {"name": "牛宿二", "nameEn": "Dabih"}, {"name": "女宿一", "nameEn": "Nashira"}],
    "Aqr": [{"name": "危宿一", "nameEn": "Sadalmelik"}, {"name": "虚宿一", "nameEn": "Sadalsuud"}, {"name": "坟墓一", "nameEn": "Sadachbia"}],
    "Per": [{"name": "天船三", "nameEn": "Mirfak"}, {"name": "大陵五", "nameEn": "Algol"}],
    "Aur": [{"name": "五车二", "nameEn": "Capella"}, {"name": "五车三", "nameEn": "Menkalinan"}],
    "Hya": [{"name": "星宿一", "nameEn": "Alphard"}, {"name": "张宿一", "nameEn": "Ukdah"}],
    "Cen": [{"name": "南门二", "nameEn": "Alpha Centauri"}, {"name": "马腹一", "nameEn": "Hadar"}],
    "Car": [{"name": "老人星", "nameEn": "Canopus"}, {"name": "南船五", "nameEn": "Miaplacidus"}],
    "Eri": [{"name": "水委一", "nameEn": "Achernar"}, {"name": "天苑一", "nameEn": "Cursa"}],
    "Cet": [{"name": "天囷一", "nameEn": "Menkar"}, {"name": "土司空", "nameEn": "Diphda"}]
}

star_positions = {
    "UMa": {"Dubhe": [11.0623, 61.7511], "Merak": [11.0307, 56.3824], "Phecda": [11.5355, 53.6948], "Megrez": [12.2578, 57.0326], "Alioth": [12.9005, 55.9595], "Mizar": [13.3987, 54.9254], "Alkaid": [13.7924, 49.3133]},
    "UMi": {"Polaris": [2.5302, 89.2641], "Kochab": [14.8333, 74.1552], "Pherkad": [15.0180, 71.8333]},
    "Ori": {"Betelgeuse": [5.9194, 7.4071], "Rigel": [5.2423, -8.2017], "Bellatrix": [5.4118, 6.3497], "Alnitak": [5.6036, -1.9426], "Alnilam": [5.6036, -1.2017], "Mintaka": [5.5918, -0.2991], "Saiph": [5.7604, -9.6700]},
    "Tau": {"Aldebaran": [4.5994, 16.5097], "Alnath": [5.4118, 28.6045], "Alcyone": [3.7841, 24.1056]},
    "Gem": {"Castor": [7.5768, 31.8883], "Pollux": [7.7548, 28.0262], "Alhena": [6.3768, 16.3994]},
    "CMa": {"Sirius": [6.7525, -16.7161], "Adhara": [6.978, -28.972], "Mirzam": [6.770, -17.956]},
    "CMi": {"Procyon": [7.6550, 5.2250], "Gomeisa": [7.4210, 8.3250]},
    "Leo": {"Regulus": [10.1396, 11.9672], "Denebola": [11.9127, 14.5667], "Algieba": [10.4822, 19.8373], "Zosma": [11.3331, 20.5233]},
    "Vir": {"Spica": [13.4199, -11.1614], "Porrima": [12.2358, -1.2647], "Zavijava": [11.6325, 1.7608]},
    "Boo": {"Arcturus": [14.2624, 19.1825], "Seginus": [14.7709, 38.5917]},
    "Sco": {"Antares": [16.4901, -26.4320], "Acrab": [16.0323, -19.5134], "Dschubba": [16.2207, -22.6383], "Shaula": [17.5684, -37.1039], "Sargas": [17.6315, -42.9872]},
    "Sgr": {"Kaus Australis": [19.0156, -34.3847], "Nunki": [19.0768, -27.5183], "Kaus Media": [18.7323, -21.8367], "Kaus Borealis": [18.4507, -25.5006], "Alnasl": [18.5724, -30.4008]},
    "Aql": {"Altair": [19.8463, 8.8683], "Tarazed": [19.7724, 10.6128], "Alshain": [19.9312, 6.4883]},
    "Lyr": {"Vega": [18.6156, 38.7837], "Sulafat": [18.9882, 32.9118], "Sheliak": [18.7882, 33.1309]},
    "Cyg": {"Deneb": [20.6907, 45.2803], "Albireo": [19.5135, 27.9592], "Sadr": [20.2391, 40.2568]},
    "Peg": {"Markab": [23.4386, 15.2053], "Scheat": [22.9661, 28.0852], "Algenib": [0.1397, 15.2053], "Enif": [21.7407, 9.8750]},
    "And": {"Alpheratz": [0.1397, 29.0905], "Mirach": [1.1013, 35.6207], "Almach": [2.1004, 42.3267]},
    "Psc": {"Alrescha": [2.3414, 13.5008], "Fomalhaut": [22.9608, -29.6222]},
    "Ari": {"Hamal": [2.2976, 23.4628], "Sheratan": [1.8700, 20.7185], "Mesarthim": [1.9284, 19.1367]},
    "Cnc": {"Acubens": [8.3330, 11.9008], "Tarf": [8.1700, 9.1008], "Asellus Borealis": [8.6617, 12.3423]},
    "Lib": {"Zubenelgenubi": [14.7635, -16.0417], "Zubeneschamali": [14.3147, -9.3829]},
    "Cap": {"Algedi": [20.4625, -12.5058], "Dabih": [20.5386, -14.7458], "Nashira": [21.0853, -16.7417]},
    "Aqr": {"Sadalmelik": [22.0996, -0.1967], "Sadalsuud": [21.4717, -5.0722], "Sadachbia": [22.2628, -1.9503]},
    "Per": {"Mirfak": [3.4843, 49.8609], "Algol": [3.2522, 40.9557]},
    "Aur": {"Capella": [5.2782, 45.9980], "Menkalinan": [5.1689, 44.9321]},
    "Hya": {"Alphard": [9.4587, -8.6588], "Ukdah": [8.8705, -2.7436]},
    "Cen": {"Alpha Centauri": [14.6614, -60.8339], "Hadar": [14.0638, -59.6888]},
    "Car": {"Canopus": [6.3992, -52.6957], "Miaplacidus": [9.2246, -69.7167]},
    "Eri": {"Achernar": [1.6286, -57.2367], "Cursa": [5.2013, -5.0903]},
    "Cet": {"Menkar": [3.2522, 4.0883], "Diphda": [0.4265, -17.9867]}
}


def update_constellation():
    filepath = os.path.join(BASE_DIR, "constellation.json")
    with open(filepath, "r", encoding="utf-8") as f:
        constellations = json.load(f)

    for c in constellations:
        cid = c["id"]
        if "season" in c and "bestSeason" not in c:
            c["bestSeason"] = c["season"]
        elif "bestSeason" not in c:
            c["bestSeason"] = "春季"

        if cid in main_stars_map:
            c["mainStars"] = main_stars_map[cid]

        line_vertices = []
        if cid in star_positions and "lines" in c:
            main_names = [s["nameEn"] for s in c.get("mainStars", [])]
            for line in c["lines"]:
                if len(line) >= 2:
                    idx1 = line[0] - 1
                    idx2 = line[1] - 1
                    if 0 <= idx1 < len(main_names) and 0 <= idx2 < len(main_names):
                        name1 = main_names[idx1]
                        name2 = main_names[idx2]
                        if name1 in star_positions[cid] and name2 in star_positions[cid]:
                            line_vertices.append([
                                star_positions[cid][name1],
                                star_positions[cid][name2]
                            ])

        if not line_vertices:
            stars_list = list(star_positions.get(cid, {}).values())
            for i in range(len(stars_list) - 1):
                line_vertices.append([stars_list[i], stars_list[i + 1]])

        c["lineVertices"] = line_vertices

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(constellations, f, ensure_ascii=False, indent=2)

    print(f"constellation.json: {len(constellations)} 个星座已更新")


def update_planet_orbit():
    filepath = os.path.join(BASE_DIR, "planetOrbit.json")
    with open(filepath, "r", encoding="utf-8") as f:
        planets = json.load(f)

    planet_data = {
        "mercury": {"initialAngle": 28.0, "inclination": 7.0},
        "venus": {"initialAngle": 156.0, "inclination": 3.39},
        "earth": {"initialAngle": 288.0, "inclination": 0.0},
        "mars": {"initialAngle": 208.0, "inclination": 1.85},
        "jupiter": {"initialAngle": 232.0, "inclination": 1.31},
        "saturn": {"initialAngle": 86.0, "inclination": 2.49},
        "uranus": {"initialAngle": 18.0, "inclination": 0.77},
        "neptune": {"initialAngle": 352.0, "inclination": 1.77}
    }

    for p in planets:
        pid = p.get("id", "")
        if pid in planet_data:
            p["initialAngle"] = planet_data[pid]["initialAngle"]
            p["inclination"] = planet_data[pid]["inclination"]

    with open(filepath, "w", encoding="utf-8") as f:
        json.dump(planets, f, ensure_ascii=False, indent=2)

    print(f"planetOrbit.json: {len(planets)} 颗行星已更新")


if __name__ == "__main__":
    update_star_catalog()
    update_constellation()
    update_planet_orbit()
    print("所有文件更新完成！")
