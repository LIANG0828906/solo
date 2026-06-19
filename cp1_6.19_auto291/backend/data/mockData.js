const sizes = ['small', 'medium', 'large'];

function createCompartments(cabinetId) {
  const compartments = [];
  for (let i = 0; i < 10; i++) {
    const size = sizes[i % 3];
    let status = 'available';
    let pickupCode = null;
    let storedAt = null;
    let maxDuration = null;
    let recipientPhone = null;
    let depositorPhone = null;
    let failedAttempts = 0;
    let lockedUntil = null;

    if (i >= 4 && i <= 6) {
      status = 'occupied';
      pickupCode = String(1000 + Math.floor(Math.random() * 9000));
      storedAt = new Date(Date.now() - Math.random() * 3600000).toISOString();
      maxDuration = 60;
      recipientPhone = `138${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;
      depositorPhone = `139${String(Math.floor(Math.random() * 100000000)).padStart(8, '0')}`;
    }

    if (i === 9 && cabinetId === 'cabinet-0') {
      status = 'overdue';
      pickupCode = '1234';
      storedAt = new Date(Date.now() - 7200000).toISOString();
      maxDuration = 60;
      recipientPhone = '13800001111';
      depositorPhone = '13900002222';
    }

    compartments.push({
      id: `${cabinetId}-slot-${i}`,
      cabinetId,
      index: i,
      size,
      status,
      pickupCode,
      storedAt,
      maxDuration,
      recipientPhone,
      depositorPhone,
      failedAttempts,
      lockedUntil,
    });
  }
  return compartments;
}

const cabinetNames = [
  '中关村站', '望京站', '国贸站', '西二旗站', '五道口站',
  '朝阳门站', '东直门站', '西单站', '三元桥站', '亦庄站'
];

const cabinets = [];
for (let i = 0; i < 10; i++) {
  cabinets.push({
    id: `cabinet-${i}`,
    name: cabinetNames[i],
    row: i,
    compartments: createCompartments(`cabinet-${i}`),
  });
}

module.exports = { cabinets };
