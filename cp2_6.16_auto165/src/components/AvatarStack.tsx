import Avatar from './Avatar';
import { useAppStore } from '@/store';

interface AvatarStackProps {
  volunteerIds: string[];
  max?: number;
}

export default function AvatarStack({ volunteerIds, max = 3 }: AvatarStackProps) {
  const getVolunteerById = useAppStore((state) => state.getVolunteerById);
  const visible = volunteerIds.slice(0, max);
  const remaining = volunteerIds.length - max;

  return (
    <div className="flex items-center">
      {visible.map((id, index) => {
        const volunteer = getVolunteerById(id);
        if (!volunteer) return null;
        return (
          <div key={id} className={index > 0 ? '-ml-2' : ''}>
            <Avatar
              name={volunteer.name}
              size="sm"
              className="ring-2 ring-white"
            />
          </div>
        );
      })}
      {remaining > 0 && (
        <div className="-ml-2 w-8 h-8 rounded-full bg-navy-900 text-white text-xs font-semibold flex items-center justify-center ring-2 ring-white">
          +{remaining}
        </div>
      )}
    </div>
  );
}
