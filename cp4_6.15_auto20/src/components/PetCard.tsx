import React from 'react';
import { Pet, Gender, VaccineStatus } from '@/types';
import { Heart, Syringe, Scissors } from 'lucide-react';

interface PetCardProps {
  pet: Pet;
  onClick: () => void;
}

const genderLabel: Record<Gender, string> = {
  [Gender.MALE]: '公',
  [Gender.FEMALE]: '母',
  [Gender.UNKNOWN]: '未知',
};

const vaccineColor: Record<VaccineStatus, string> = {
  [VaccineStatus.FULLY_VACCINATED]: 'bg-green-100 text-green-700 border-green-200',
  [VaccineStatus.PARTIALLY_VACCINATED]: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  [VaccineStatus.NOT_VACCINATED]: 'bg-red-50 text-red-600 border-red-200',
};

const vaccineLabel: Record<VaccineStatus, string> = {
  [VaccineStatus.FULLY_VACCINATED]: '已接种',
  [VaccineStatus.PARTIALLY_VACCINATED]: '部分接种',
  [VaccineStatus.NOT_VACCINATED]: '未接种',
};

const PetCard: React.FC<PetCardProps> = ({ pet, onClick }) => {
  const ageText =
    pet.ageYears > 0
      ? `${pet.ageYears}岁${pet.ageMonths > 0 ? pet.ageMonths + '个月' : ''}`
      : `${pet.ageMonths}个月`;

  return (
    <div
      onClick={onClick}
      className="group bg-white rounded-2xl overflow-hidden cursor-pointer
        shadow-[0_2px_8px_rgba(90,143,110,0.08)] hover:shadow-[0_8px_24px_rgba(90,143,110,0.15)]
        transition-all duration-300 ease-out hover:-translate-y-0.5
        border border-green-50"
    >
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-green-50 to-green-100">
        {pet.photos[0] ? (
          <img
            src={pet.photos[0]}
            alt={pet.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-green-300">
            <Heart size={48} />
          </div>
        )}
        <div className="absolute top-3 right-3">
          <span
            className={`text-xs px-2.5 py-1 rounded-full font-medium border ${
              pet.gender === Gender.MALE
                ? 'bg-blue-50 text-blue-600 border-blue-100'
                : 'bg-pink-50 text-pink-600 border-pink-100'
            }`}
          >
            {genderLabel[pet.gender]}
          </span>
        </div>
        {pet.status !== 'available' && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <span className="text-white font-bold text-lg">
              {pet.status === 'adopted' ? '已领养' : '审核中'}
            </span>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3
            className="text-lg font-bold text-gray-800"
            style={{ fontFamily: "'Merriweather', serif" }}
          >
            {pet.name}
          </h3>
          <span className="text-sm text-gray-500">{ageText}</span>
        </div>

        <p className="text-sm text-green-700 font-medium mb-3">{pet.breed}</p>

        <div className="flex items-center gap-2 mb-3 flex-wrap">
          <span
            className={`text-xs px-2 py-1 rounded-md border flex items-center gap-1 ${
              vaccineColor[pet.vaccineStatus]
            }`}
          >
            <Syringe size={12} />
            {vaccineLabel[pet.vaccineStatus]}
          </span>
          {pet.neutered && (
            <span className="text-xs px-2 py-1 rounded-md border bg-teal-50 text-teal-700 border-teal-200 flex items-center gap-1">
              <Scissors size={12} />
              已绝育
            </span>
          )}
          <span className="text-xs px-2 py-1 rounded-md bg-gray-50 text-gray-600 border border-gray-200">
            {pet.weight}kg
          </span>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {pet.personalityTags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-100"
            >
              {tag}
            </span>
          ))}
          {pet.personalityTags.length > 3 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-gray-50 text-gray-500">
              +{pet.personalityTags.length - 3}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default PetCard;
