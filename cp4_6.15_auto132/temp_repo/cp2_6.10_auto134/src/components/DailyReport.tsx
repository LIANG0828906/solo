import React, { useMemo } from 'react';
import { useLedgerStore } from '../store';
import { formatTangTime } from '../utils';

const DailyReport: React.FC = () => {
  const { transactions, goods, getDailyStats, hasStamp, toggleStamp, isLowStock } = useLedgerStore();

  const stats = useMemo(() => getDailyStats(), [getDailyStats]);
  
  const today = useMemo(() => {
    const d = new Date();
    return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
  }, []);

  const todayTxs = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    const todayStart = d.getTime();
    return transactions
      .filter((t) => t.timestamp >= todayStart)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [transactions]);

  const lowStockItems = useMemo(() => {
    return goods.filter((g) => isLowStock(g));
  }, [goods, isLowStock]);

  const slowMovingItems = useMemo(() => {
    return goods
      .filter((g) => g.quarterSales > 0)
      .sort((a, b) => {
        const ratioA = a.stock / a.quarterSales;
        const ratioB = b.stock / b.quarterSales;
        return ratioB - ratioA;
      })
      .slice(0, 3);
  }, [goods]);

  return (
    <div className="report-container">
      <div className="scroll-report">
        <h1 className="report-title">西市胡商日账</h1>
        
        <div className="report-section">
          <h2>账期</h2>
          <p>大唐开元年间 {today}</p>
          <p>记账人: 康国粟特商胡 曼苏尔</p>
          <p>营业地点: 长安西市 绢帛行 丙字三号铺</p>
        </div>

        <div className="report-section">
          <h2>今日交易流水</h2>
          {todayTxs.length === 0 ? (
            <p style={{ color: '#999', fontStyle: 'italic' }}>今日暂无交易记录</p>
          ) : (
            <table className="report-table">
              <thead>
                <tr>
                  <th>时辰</th>
                  <th>货物</th>
                  <th>买家</th>
                  <th>来源</th>
                  <th>数量</th>
                  <th>单价</th>
                  <th>总价</th>
                  <th>抽税</th>
                  <th>结算</th>
                </tr>
              </thead>
              <tbody>
                {todayTxs.map((tx) => (
                  <tr key={tx.id}>
                    <td>{tx.timeStr}</td>
                    <td>{tx.goodsName}</td>
                    <td>{tx.buyerName}</td>
                    <td>{tx.buyerOrigin}</td>
                    <td>{tx.quantity}</td>
                    <td>{tx.unitPrice}文</td>
                    <td>{tx.totalPrice}文</td>
                    <td>{tx.tax}文</td>
                    <td>{tx.currencyAmount} {tx.currency}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="report-section">
          <h2>税费汇总</h2>
          <table className="report-table">
            <tbody>
              <tr>
                <td>今日交易总额</td>
                <td className={stats.totalRevenue > 5000 ? 'profit-positive' : ''}>
                  {stats.totalRevenue}文
                </td>
              </tr>
              <tr>
                <td>市舶使抽税 (2%)</td>
                <td>{stats.totalTax}文</td>
              </tr>
              <tr>
                <td>今日实收</td>
                <td className="profit-positive">{stats.totalProfit}文</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="report-section">
          <h2>库存变更明细</h2>
          <table className="report-table">
            <thead>
              <tr>
                <th>货物</th>
                <th>期初库存</th>
                <th>今日售出</th>
                <th>期末库存</th>
                <th>状态</th>
              </tr>
            </thead>
            <tbody>
              {stats.stockChanges.map((sc) => (
                <tr key={sc.goods.id}>
                  <td>{sc.goods.name}</td>
                  <td>{sc.initialStock}{sc.goods.unit}</td>
                  <td style={{ color: sc.change < 0 ? '#cc3333' : '#3b5e3b' }}>
                    {sc.change > 0 ? '+' : ''}{sc.change}{sc.goods.unit}
                  </td>
                  <td>{sc.goods.stock}{sc.goods.unit}</td>
                  <td>
                    {isLowStock(sc.goods) ? (
                      <span style={{ color: '#ff7f00' }}>库存不足</span>
                    ) : (
                      <span style={{ color: '#3b5e3b' }}>正常</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="report-section">
          <h2>库存预警</h2>
          {lowStockItems.length > 0 ? (
            <div>
              <p style={{ color: '#ff7f00', marginBottom: '8px' }}>⚠ 以下货物库存已低于安全线，请及时补货：</p>
              <ul style={{ paddingLeft: '24px' }}>
                {lowStockItems.map((item) => (
                  <li key={item.id}>
                    {item.name} - 当前库存: {item.stock}{item.unit}，
                    安全库存: {Math.round(item.quarterSales * 0.2)}{item.unit}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p style={{ color: '#3b5e3b' }}>✓ 所有货物库存充足</p>
          )}
        </div>

        <div className="report-section">
          <h2>滞销货物</h2>
          <p style={{ marginBottom: '8px' }}>以下货物周转较慢，建议促销：</p>
          <ul style={{ paddingLeft: '24px' }}>
            {slowMovingItems.map((item) => (
              <li key={item.id}>
                {item.name} - 库存: {item.stock}{item.unit}，
                季销量: {item.quarterSales}{item.unit}，
                周转天数: {Math.round((item.stock / item.quarterSales) * 90)}天
              </li>
            ))}
          </ul>
        </div>

        <div className="report-section">
          <h2>损益表</h2>
          <table className="report-table">
            <tbody>
              <tr>
                <td>今日营业收入</td>
                <td className="profit-positive">+{stats.totalRevenue}文</td>
              </tr>
              <tr>
                <td>减：市舶使税</td>
                <td className="profit-negative">-{stats.totalTax}文</td>
              </tr>
              <tr>
                <td style={{ fontWeight: 'bold' }}>今日净收益</td>
                <td className={stats.totalProfit >= 0 ? 'profit-positive' : 'profit-negative'}>
                  {stats.totalProfit >= 0 ? '+' : ''}{stats.totalProfit}文
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {hasStamp && (
          <div className="stamp">
            <div className="stamp-text">
              <div className="main">商</div>
              <div>康国曼苏尔</div>
              <div>记</div>
            </div>
          </div>
        )}

        <button className="stamp-btn" onClick={toggleStamp}>
          {hasStamp ? '注销印章' : '钤印'}
        </button>
      </div>
    </div>
  );
};

export default DailyReport;
