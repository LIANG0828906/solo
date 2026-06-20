import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import { addDays, isAfter, isBefore, now } from 'date-fns';
import type {
  Coupon,
  CouponData,
  CouponRule,
  CouponType,
  CouponWithClaimed,
  ClaimedCouponWithCoupon,
} from '../shared/types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data', 'coupons.json');

app.use(cors());
app.use(bodyParser.json());

async function readData(): Promise<CouponData> {
  const raw = await fs.readFile(DATA_FILE, 'utf-8');
  return JSON.parse(raw) as CouponData;
}

async function writeData(data: CouponData): Promise<void> {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

app.post('/api/coupons', async (req, res) => {
  try {
    const { name, type, rule, totalQuantity, validDays } = req.body as {
      name: string;
      type: CouponType;
      rule: CouponRule;
      totalQuantity: number;
      validDays: number;
    };

    if (!name || !type || !rule || totalQuantity === undefined || validDays === undefined) {
      res.status(400).json({ success: false, message: '缺少必要参数' });
      return;
    }

    const data = await readData();
    const nowStr = new Date().toISOString();
    const validFrom = nowStr;
    const validUntil = addDays(new Date(), validDays).toISOString();

    const coupon: Coupon = {
      id: uuidv4(),
      name,
      type,
      rule,
      totalQuantity,
      claimedQuantity: 0,
      validFrom,
      validUntil,
      createdAt: nowStr,
    };

    data.coupons.push(coupon);
    await writeData(data);

    res.json({ success: true, coupon });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/coupons', async (req, res) => {
  try {
    const { userId } = req.query as { userId?: string };
    const data = await readData();

    const coupons: CouponWithClaimed[] = data.coupons.map((coupon) => {
      const claimed = userId
        ? data.claims.some((c) => c.couponId === coupon.id && c.userId === userId)
        : false;
      return { ...coupon, claimed };
    });

    res.json(coupons);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/claim', async (req, res) => {
  try {
    const { couponId, userId } = req.body as { couponId: string; userId: string };

    if (!couponId || !userId) {
      res.status(400).json({ success: false, message: '缺少必要参数' });
      return;
    }

    const data = await readData();
    const coupon = data.coupons.find((c) => c.id === couponId);

    if (!coupon) {
      res.status(400).json({ success: false, message: '优惠券不存在' });
      return;
    }

    if (coupon.claimedQuantity >= coupon.totalQuantity) {
      res.status(400).json({ success: false, message: '优惠券已领完' });
      return;
    }

    const nowTime = now();
    if (isBefore(nowTime, new Date(coupon.validFrom).getTime())) {
      res.status(400).json({ success: false, message: '优惠券尚未开始领取' });
      return;
    }
    if (isAfter(nowTime, new Date(coupon.validUntil).getTime())) {
      res.status(400).json({ success: false, message: '优惠券已过期' });
      return;
    }

    const alreadyClaimed = data.claims.some(
      (c) => c.couponId === couponId && c.userId === userId
    );
    if (alreadyClaimed) {
      res.status(400).json({ success: false, message: '您已领取过该优惠券' });
      return;
    }

    coupon.claimedQuantity += 1;
    data.claims.push({
      couponId,
      userId,
      claimedAt: new Date().toISOString(),
      used: false,
    });

    await writeData(data);
    res.json({ success: true, message: '领取成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.get('/api/claims', async (req, res) => {
  try {
    const { userId } = req.query as { userId?: string };

    if (!userId) {
      res.status(400).json({ success: false, message: '缺少userId参数' });
      return;
    }

    const data = await readData();
    const userClaims = data.claims.filter((c) => c.userId === userId);

    const result: ClaimedCouponWithCoupon[] = userClaims
      .map((claim) => {
        const coupon = data.coupons.find((c) => c.id === claim.couponId);
        if (!coupon) return null;
        return { ...claim, coupon };
      })
      .filter((item): item is ClaimedCouponWithCoupon => item !== null);

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.post('/api/redeem', async (req, res) => {
  try {
    const { code, purchaseAmount, productIds } = req.body as {
      code: string;
      purchaseAmount?: number;
      productIds?: string[];
    };

    if (!code) {
      res.status(400).json({ success: false, message: '缺少核销码' });
      return;
    }

    const [couponId, userId] = code.split(':');
    if (!couponId || !userId) {
      res.status(400).json({ success: false, message: '核销码格式错误' });
      return;
    }

    const data = await readData();
    const claim = data.claims.find(
      (c) => c.couponId === couponId && c.userId === userId
    );

    if (!claim) {
      res.status(400).json({ success: false, message: '未找到领取记录' });
      return;
    }

    if (claim.used) {
      res.status(400).json({ success: false, message: '优惠券已使用' });
      return;
    }

    const coupon = data.coupons.find((c) => c.id === couponId);
    if (!coupon) {
      res.status(400).json({ success: false, message: '优惠券不存在' });
      return;
    }

    const nowTime = now();
    if (isAfter(nowTime, new Date(coupon.validUntil).getTime())) {
      res.status(400).json({ success: false, message: '优惠券已过期' });
      return;
    }

    if (coupon.rule.minAmount !== undefined && purchaseAmount !== undefined) {
      if (purchaseAmount < coupon.rule.minAmount) {
        res
          .status(400)
          .json({ success: false, message: `未达到最低消费金额 ${coupon.rule.minAmount}` });
        return;
      }
    }

    if (coupon.rule.applicableProducts && coupon.rule.applicableProducts.length > 0 && productIds) {
      const hasApplicableProduct = productIds.some((pid) =>
        coupon.rule.applicableProducts.includes(pid)
      );
      if (!hasApplicableProduct) {
        res.status(400).json({ success: false, message: '无适用商品' });
        return;
      }
    }

    claim.used = true;
    claim.usedAt = new Date().toISOString();

    await writeData(data);
    res.json({ success: true, message: '核销成功' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: '服务器错误' });
  }
});

app.listen(PORT, () => {
  console.log(`Server ready on port ${PORT}`);
});
