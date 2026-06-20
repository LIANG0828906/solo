import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMedicineStore } from '../store/medicineStore';
import MedicineCard from '../components/MedicineCard';
import TrendChart from '../components/TrendChart';
import Timeline from '../components/Timeline';
import { Pill, AlertTriangle, TrendingUp, ClipboardList } from 'lucide-react';

const Dashboard = () => {
  const {
    medicines,
    operationLogs,
    get7DayTrend,
    getPendingPrescriptions,
    getLowStockMedicines,
  } = useMedicineStore();

  const trendData = useMemo(() => get7DayTrend(), [get7DayTrend]);
  const pendingCount = useMemo(() => getPendingPrescriptions(), [getPendingPrescriptions]);
  const lowStockMedicines = useMemo(() => getLowStockMedicines(), [getLowStockMedicines]);
  const totalStock = useMemo(
    () => medicines.reduce((sum, med) => sum + med.stock, 0),
    [medicines]
  );

  const stats = [
    {
      label: '药材总库存',
      value: `${totalStock}g`,
      icon: Pill,
      color: '#c9a96e',
    },
    {
      label: '药材种类',
      value: medicines.length,
      icon: ClipboardList,
      color: '#8d6e63',
    },
    {
      label: '待抓方剂',
      value: pendingCount,
      icon: TrendingUp,
      color: '#d4a373',
    },
    {
      label: '库存预警',
      value: lowStockMedicines.length,
      icon: AlertTriangle,
      color: lowStockMedicines.length > 0 ? '#f44336' : '#4caf50',
    },
  ];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      <motion.div
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            className="bg-white/50 rounded-lg p-4 card-shadow"
            variants={item}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-12 h-12 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${stat.color}20` }}
              >
                <stat.icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
              <div>
                <p className="text-xs text-[#6d4c41]">{stat.label}</p>
                <p className="text-xl font-bold text-[#3e2723]">{stat.value}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <motion.div
        className="bg-white/50 rounded-lg p-6 card-shadow mb-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <h2 className="text-xl font-bold text-[#3e2723] mb-4 traditional-font flex items-center gap-2">
          <Pill className="w-6 h-6 text-[#8d6e63]" />
          药柜总览
        </h2>
        <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 responsive-grid">
          {medicines.map((medicine, index) => (
            <motion.div
              key={medicine.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 + index * 0.05 }}
            >
              <MedicineCard medicine={medicine} />
            </motion.div>
          ))}
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <TrendChart data={trendData} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Timeline logs={operationLogs} />
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
