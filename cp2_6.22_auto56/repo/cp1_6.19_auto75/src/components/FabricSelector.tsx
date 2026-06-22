import { Fabric, FabricType } from '../types';
import { fabricData } from '../data/clothing';
import { carbonTracker } from '../services/CarbonTracker';
import { FaLeaf, FaRecycle, FaTree, FaSeedling } from 'react-icons/fa';

interface FabricSelectorProps {
  selectedFabric: FabricType;
  onSelect: (fabric: FabricType) => void;
}

const fabricIcons: Record<FabricType, React.ReactNode> = {
  organicCotton: <FaLeaf size={18} />,
  recycledPolyester: <FaRecycle size={18} />,
  tencel: <FaTree size={18} />,
  hemp: <FaSeedling size={18} />
};

export function FabricSelector({ selectedFabric, onSelect }: FabricSelectorProps) {
  const fabrics = Object.entries(fabricData).map(([type, data]) => ({
    type: type as FabricType,
    ...data
  }));

  return (
    <div className="w-full">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        选择面料
      </label>
      <div className="space-y-2">
        {fabrics.map((fabric) => {
          const isSelected = selectedFabric === fabric.type;
          const impact = carbonTracker.getFabricCarbonImpact(fabric.type);
          const impactColor =
            impact.level === 'low'
              ? 'text-green-600'
              : impact.level === 'medium'
              ? 'text-yellow-600'
              : 'text-red-600';

          return (
            <button
              key={fabric.type}
              type="button"
              onClick={() => onSelect(fabric.type)}
              className={`w-full p-3 rounded-lg border-2 transition-all duration-200 text-left ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50 shadow-md'
                  : 'border-gray-200 bg-white hover:border-emerald-300 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-start gap-3">
                <div
                  className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                    isSelected ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {fabricIcons[fabric.type]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-medium ${
                        isSelected ? 'text-emerald-700' : 'text-gray-800'
                      }`}
                    >
                      {fabric.name}
                    </span>
                    <span className={`text-xs font-medium ${impactColor}`}>
                      {impact.level === 'low'
                        ? '低碳'
                        : impact.level === 'medium'
                        ? '中碳'
                        : '高碳'}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                    {fabric.description}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">碳因子:</span>
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${impactColor.replace('text-', 'bg-')}`}
                        style={{ width: `${fabric.carbonFactor * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-gray-500">
                      {fabric.carbonFactor.toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
